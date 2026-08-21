// code related to working with Offering.Playout or ChannelOffering.Playout

const assocComputed = require('@eluvio/elv-js-helpers/Functional/assocComputed')
const clone = require('@eluvio/elv-js-helpers/Functional/clone')
const mapObjValues = require('@eluvio/elv-js-helpers/Functional/mapObjValues')
const omit = require('@eluvio/elv-js-helpers/Functional/omit')
const pickBy = require('@eluvio/elv-js-helpers/Functional/pickBy')
const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const Offering = require('./Offering')

const blueprint = {
  name: 'Playout',
  concerns: []
}


const ensureStreamLabels = ({playout}) => {
  const pCopy = clone(playout)
  const poStreams = safeStreams({playout})
  pCopy.streams = mapObjValues(
    (poStream, poStreamKey) => assocComputed(
      'label',
      () => poStream.label || poStreamKey,
      poStream
    ),
    poStreams
  )
  return pCopy
}

const ensureStreamMediaTypes = ({playout, offering}) => {
  const pCopy = clone(playout)

  pCopy.streams = mapObjValues(
    (poStream, poStreamKey) => assocComputed(
      'media_type',
      () => poStream.media_type || Offering.msStreamForPoStream({
        offering,
        poStreamKey
      }).codec_type,
      poStream
    ),
    safeStreams({playout})
  )
  return pCopy
}

const safePlayoutFormats = ({playout}) => playout.playout_formats || throwError('playout has no playout_formats')

const safeStream = ({
  playout,
  poStreamKey
}) => safeStreams({playout})[poStreamKey] || throwError(`Playout stream ${poStreamKey} not found or empty`)

const safeStreams = ({playout}) => playout.streams || throwError('playout has no streams')

const withoutDRM = ({playout}) => {
  const pCopy = clone(playout)
  pCopy.playout_formats = pickBy(
    f => !f.drm,
    safePlayoutFormats({playout: pCopy})
  )
  pCopy.drm_keys = {}
  const poStreams = safeStreams({playout})
  const filterEncryptionSchemes = omit(['encryption_schemes'])

  pCopy.streams = mapObjValues(
    filterEncryptionSchemes,
    poStreams //safeStreams({playout})
  )
  return pCopy
}


const New = () => {

  // instance interface


  return {}
}

module.exports = {
  blueprint,
  ensureStreamLabels,
  ensureStreamMediaTypes,
  safePlayoutFormats,
  safeStream,
  safeStreams,
  withoutDRM,
  New
}
