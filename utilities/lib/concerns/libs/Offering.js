// code related to working with offerings
'use strict'

const compare = require('@eluvio/elv-js-helpers/Functional/compare')
const fraction = require('@eluvio/elv-js-helpers/Conversion/fraction')
const fracStrToNum = require('@eluvio/elv-js-helpers/Conversion/fracStrToNum')
const throwError = require('@eluvio/elv-js-helpers/Misc/throwError.js')


const Logger = require('../kits/Logger.js')
const OfferingPlayoutStream = require('./OfferingPlayoutStream')

const blueprint = {
  name: 'Offering',
  concerns: [Logger]
}

const durationFrac = ({offering}) => fraction(durationRatStr({offering}))

const durationNum = ({offering}) => fracStrToNum(durationRatStr({offering}))

const durationRatStr = ({offering}) => offering.media_struct.duration_rat

const firstVideoStreamKey = ({offering}) => {
  // sort alphabetically by stream key
  for (const [streamKey, stream] of sortedStreamsKV({offering})) {
    if (stream.codec_type === 'video') return streamKey
  }
  throwError('No video stream found in offering')
}

const playoutStreamKeys = ({offering}) => Object.keys(offering.playout.streams)

const playoutStreamPartHashes = ({offering, playoutStreamKey, repKey = '', transcodes = {}}) => {
  if (!playoutStreamKeys({offering}).includes(playoutStreamKey)) throwError(`playout streams do not include one with key '${playoutStreamKey}'`)
  const playoutStream = offering.playout.streams[playoutStreamKey]
  if (repKey === '') {
    // assume top rep is desired
    repKey = OfferingPlayoutStream.topRepKey({playoutStream})
  }
  const rep = playoutStream.representations[repKey]
  const sources = rep.transcode_id
    ? transcodes.stream.sources
    : offering.media_struct[playoutStream.media_struct_stream_key].sources

  // TODO: check if in new compact format

  return sources.map(s => s.source)
}


const sortedStreamsKV = ({offering}) => Object.entries(offering.media_struct.streams).sort((a, b) => compare(a[0], b[0]))

const New = () => {


  // instance interface
  return {}
}

module.exports = {
  blueprint,
  durationFrac,
  durationNum,
  durationRatStr,
  firstVideoStreamKey,
  playoutStreamKeys,
  playoutStreamPartHashes,
  sortedStreamsKV,
  New
}
