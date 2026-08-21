// code related to working with offerings

const compare = require('@eluvio/elv-js-helpers/Functional/compare')
const fraction = require('@eluvio/elv-js-helpers/Conversion/fraction')
const fracStrToNum = require('@eluvio/elv-js-helpers/Conversion/fracStrToNum')
const pickBy = require('@eluvio/elv-js-helpers/Functional/pickBy')
const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const Client = require('../Client')
const Logger = require('../Logger')
const Metadata = require('../Metadata')
const PlayoutStream = require('./PlayoutStream')
const Representations = require('./Representations')

const clone = require('@eluvio/elv-js-helpers/Functional/clone')

const blueprint = {
  name: 'Offering',
  concerns: [Logger, Metadata, Client]
}

const durationFrac = ({offering}) => fraction(durationRatStr({offering}))

const durationNum = ({offering}) => fracStrToNum(durationRatStr({offering}))

const durationRatStr = ({offering}) => offering.media_struct.duration_rat

const firstVideoStreamKey = ({offering}) => {
  // sort alphabetically by stream key
  for (const [streamKey, stream] of sortedMsStreamsKV({offering})) {
    if (stream.codec_type === 'video') return streamKey
  }
  throw new Error('No video stream found in offering')
}

const msStreamForPoStream = ({offering, poStreamKey}) => {
  const poStream = safePlayoutStream({offering, poStreamKey})

  const safeReps = PlayoutStream.safeRepresentations({poStream})
  const topRep = Representations.topRep({representations: safeReps})
  const msStreamKey = topRep.media_struct_stream_key

  return safeMediaStructStream({offering, msStreamKey})
}
const safeMediaStruct = ({offering}) => offering.media_struct || throwError('Offering has no media_struct')

const safeMediaStructStream = ({
  offering,
  msStreamKey
}) => safeMediaStructStreams({offering})[msStreamKey] || throwError(`Offering media_struct has no stream ${msStreamKey}`)

const safeMediaStructStreams = ({offering}) => safeMediaStruct({offering}).streams || throwError('Offering media_struct has no streams')

const safePlayout = ({offering}) => offering.playout || throwError('Offering has no playout')

const safePlayoutStream = ({
  offering,
  poStreamKey
}) => safePlayoutStreams({offering})[poStreamKey] || throwError(`Offering playout stream ${poStreamKey} not found or empty`)

const safePlayoutStreams = ({offering}) => safePlayout({offering}).streams || throwError('Offering playout streams empty')

const selectPoStreams = ({poStreamKeys, offering}) => {
  const oCopy = clone(offering)
  const poStreamsCopy = safePlayoutStreams({offering})
  oCopy.playout.streams = {}
  poStreamKeys.forEach(
    poStreamKey => {
      const poStream = poStreamsCopy[poStreamKey]
      if (!poStream) throwError(`Offering playout stream '${poStreamKey}' not found`)
      oCopy.playout.streams[poStreamKey] = poStream
    }
  )
  return oCopy
}

const sortedMsStreamsKV = ({offering}) => Object.entries(offering.media_struct.streams)
  .sort((a, b) => compare(a[0], b[0]))

const withAudioVideoStreamsOnly = ({offering}) => {
  const oCopy = clone(offering)

  oCopy.playout.streams = pickBy(
    (poStream, poStreamKey) => {
      const msStream = msStreamForPoStream({offering, poStreamKey})
      return ['audio', 'video'].includes(msStream.codec_type)
    },
    safePlayoutStreams({offering})
  )

  oCopy.media_struct.streams = pickBy(
    msStream => ['audio', 'video'].includes(msStream.codec_type),
    safeMediaStructStreams({offering})
  )

  return oCopy
}

const New = context => {

  const get = async ({libraryId, objectId, versionHash, writeToken, offeringKey}) => {
    return await context.concerns.Metadata.get({
      libraryId,
      objectId,
      versionHash,
      writeToken,
      subtree: `/offerings/${offeringKey}`
    })
  }

  // instance interface
  return {
    get
  }
}

module.exports = {
  blueprint,
  durationFrac,
  durationNum,
  durationRatStr,
  firstVideoStreamKey,
  msStreamForPoStream,
  safeMediaStruct,
  safeMediaStructStream,
  safeMediaStructStreams,
  safePlayout,
  safePlayoutStream,
  safePlayoutStreams,
  selectPoStreams,
  sortedMsStreamsKV,
  withAudioVideoStreamsOnly,
  New
}
