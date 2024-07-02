// code related to working with offerings

const fraction = require('@eluvio/elv-js-helpers/Conversion/fraction')
const fracStrToNum = require('@eluvio/elv-js-helpers/Conversion/fracStrToNum')

const compare = require('@eluvio/elv-js-helpers/Functional/compare')

const Logger = require('../kits/Logger')
const Metadata = require('./Metadata')

const blueprint = {
  name: 'Offering',
  concerns: [Logger, Metadata]
}

const durationFrac = ({offering}) => fraction(durationRatStr({offering}))

const durationNum = ({offering}) => fracStrToNum(durationRatStr({offering}))

const durationRatStr = ({offering}) => offering.media_struct.duration_rat

const firstVideoStreamKey = ({offering}) => {
  // sort alphabetically by stream key
  for(const [streamKey, stream] of sortedStreamsKV({offering})) {
    if(stream.codec_type === 'video') return streamKey
  }
  throw new Error('No video stream found in offering')
}

const sortedStreamsKV =  ({offering}) => Object.entries(offering.media_struct.streams).sort((a,b) => compare(a[0], b[0]))

const New = context => {

  const get = async ({libraryId, objectId, offeringKey, versionHash, writeToken}) => {
    return await context.concerns.Metadata.get({
      libraryId,
      objectId,
      subtree: `/offerings/${offeringKey}`,
      versionHash,
      writeToken
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
  sortedStreamsKV,
  New
}
