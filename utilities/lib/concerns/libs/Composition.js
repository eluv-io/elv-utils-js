const clone = require('@eluvio/elv-js-helpers/Functional/clone')
const fraction = require('@eluvio/elv-js-helpers/Conversion/fraction')
const mapObjValues = require('@eluvio/elv-js-helpers/Functional/mapObjValues')
const omit = require('@eluvio/elv-js-helpers/Functional/omit')
const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const Client = require('../Client')
const FabricObject = require('./FabricObject')
const Logger = require('../Logger')
const Offering = require('./Offering')
const Playout = require('./Playout')
const PlayoutStream = require('./PlayoutStream')
const {safePlayout} = require('./Offering')

const blueprint = {
  name: 'Composition',
  concerns: [Logger, Client, FabricObject, Offering, Playout]
}

const _mapAndSelectPoStreams = ({playout, poStreamKeys, streamMap = {}}) => {
  const pCopy = clone(playout)
  pCopy.streams = {}

  poStreamKeys.forEach(
    compositionPoStreamKey => {
      const sourcePoStreamKey = streamMap[compositionPoStreamKey] || compositionPoStreamKey
      pCopy.streams[compositionPoStreamKey] = Playout.safeStream({playout, poStreamKey: sourcePoStreamKey})
    }
  )

  return pCopy
}

const _derivePlayout = ({sourceOfferings, poStreamKeys, streamMap = {}}) => {
  const primaryOfferingAVonly = Offering.withAudioVideoStreamsOnly({offering: sourceOfferings[0]})
  const primaryPlayout = safePlayout({offering: primaryOfferingAVonly})
  const remappedPlayout = _mapAndSelectPoStreams({playout: primaryPlayout, poStreamKeys, streamMap})


  const playoutWithStreamLabels = Playout.ensureStreamLabels({playout: remappedPlayout})

  primaryOfferingAVonly.playout = playoutWithStreamLabels

  return Playout.ensureStreamMediaTypes({
    offering: primaryOfferingAVonly,
    playout: playoutWithStreamLabels
  })
}

const _removeStreamRepProps = ({playout, props}) => {
  const pCopy = clone(playout)
  const poStreams = Playout.safeStreams({playout: pCopy})
  pCopy.streams = mapObjValues(
    poStream => {
      const reps = PlayoutStream.safeRepresentations({poStream})
      poStream.representations = mapObjValues(
        rep => omit(props, rep),
        reps
      )
      return poStream
    },
    poStreams
  )

  return pCopy
}

const _v1FilterStreamRepProps = ({playout}) => _removeStreamRepProps({
  playout,
  props: [
    'transcode_id',
    'transcode_matches_rep'
  ]
})


const _v2FilterStreamRepProps = ({playout}) => _removeStreamRepProps({
  playout,
  props: [
    'media_struct_stream_key',
    'transcode_id',
    'transcode_matches_rep'
  ]
})
const New = context => {

  const _getOfferings = async ({content, libraryId, objectId, writeToken}) => {
    let result = []
    for (let i = 0; i < content.sources.length; i++) {
      const source = content.sources[i]
      const offeringKey = source.offering_key
      if (source.object_id) {
        result.push(await context.concerns.Offering.get({libraryId, objectId: source.object_id, offeringKey}))
      } else {
        result.push(await context.concerns.Offering.get({libraryId, objectId, writeToken, offeringKey}))
      }
    }
    return result
  }

  const _sourceReference = async ({contentSource}) => {
    let itemSource = {}
    if (contentSource.object_id) {
      const versionHash = await context.concerns.FabricObject.latestVersionHash({
        objectId: contentSource.object_id
      })
      itemSource['.'] = {auto_update: {tag: 'latest'}}
      itemSource['/'] = `/qfab/${versionHash}/rep/playout/${contentSource.offering_key}`
    } else {
      itemSource['/'] = `./rep/playout/${contentSource.offering_key}`
    }
    return itemSource
  }

  // instance interface

  const v1Metadata = async ({content, libraryId, objectId, writeToken}) => {

    if (content.version !== 1) throwError('v1Metadata: version != 1')

    const sourceOfferings = await _getOfferings({content, libraryId, objectId, writeToken})
    const playoutWithMediaTypes = _derivePlayout({sourceOfferings, poStreamKeys: content.stream_keys})
    const playoutWithoutDRM = Playout.withoutDRM({
      offering: sourceOfferings[0],
      playout: playoutWithMediaTypes
    })
    if (!playoutWithoutDRM.playout_formats) throwError('v1 composition needs sources with clear playout formats')

    const compPlayout = _v1FilterStreamRepProps({playout: playoutWithoutDRM})

    let items = []
    for (let itemIndex = 0; itemIndex < content.timeline.length; itemIndex++) {
      const item = content.timeline[itemIndex]

      const sourceIndex = item.source_index
      if (sourceIndex < 0 || sourceIndex >= sourceOfferings.length) throwError(`source_index '${sourceIndex}' out of range`)

      const itemSource = await _sourceReference({contentSource: content.sources[sourceIndex]})
      const duration_rat = (fraction(item.end).sub(fraction(item.start))).toFraction()

      items.push({
        display_name: item.desc,
        slice_start_rat: item.start,
        slice_end_rat: item.end,
        duration_rat,
        source: itemSource,
        type: 'mez_vod'
      })
    }

    return {
      items,
      playout: compPlayout
    }
  }

  const v2Metadata = async ({content, libraryId, objectId, writeToken}) => {
    if (content.version !== 2) throwError('v1Metadata: version != 2')

    const sourceOfferings = await _getOfferings({content, libraryId, objectId, writeToken})

    let ch_sources = []
    for (let sourceIndex = 0; sourceIndex < content.sources.length; sourceIndex++) {
      const contentSource = content.sources[sourceIndex]
      const source = await _sourceReference({contentSource})
      ch_sources.push({
        source,
        stream_map: contentSource.stream_map,
        type: 'mez_vod'
      })
    }

    const poStreamKeys = content.stream_keys
    const primarySourceStreamMap = content.sources[0].stream_map
    const playoutStep1 = _derivePlayout({sourceOfferings, poStreamKeys, streamMap: primarySourceStreamMap})
    const playoutStep2 = _v2FilterStreamRepProps({playout: playoutStep1})

    const slices = content.timeline.map(
      item => {
        const startFrac = fraction(item.start)
        const endFrac = fraction(item.end)
        return [
          item.source_index,
          startFrac.n,
          startFrac.d,
          endFrac.n,
          endFrac.d
        ]
      }
    )

    return {
      ch_sources,
      playout: playoutStep2,
      primary_source_index: 0,
      slices
    }

  }
  return {
    v1Metadata,
    v2Metadata
  }
}

module.exports = {
  blueprint,
  New
}
