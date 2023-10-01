const isEmpty = require('@eluvio/elv-js-helpers/Boolean/isEmpty')
const isNil = require('@eluvio/elv-js-helpers/Boolean/isNil')

const {ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ExistObj = require('./lib/concerns/kits/ExistObj')
const ArgStreamKey = require('./lib/concerns/ArgStreamKey')
const ArgOfferingKey = require('./lib/concerns/args/ArgOfferingKey')

class OfferingDeleteStream extends Utility {
  static blueprint() {
    return {
      concerns: [ExistObj, ArgOfferingKey, ArgStreamKey],
      options: [
        ModOpt('offeringKey', {
          default: null,
          demand: true,
          descTemplate: 'Offering to delete stream from',
          type: 'string'
        }),
        ModOpt('streamKey', {
          demand: true,
          descTemplate: 'Stream to delete',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {offeringKey, streamKey} = this.args
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const offeringMetadata = await this.concerns.Metadata.get({
      libraryId,
      objectId,
      subtree: `/offerings/${offeringKey}`
    })

    if (isNil(offeringMetadata) || isEmpty(offeringMetadata)) throw Error(`Offering '${offeringKey}' not found.`)

    if (!offeringMetadata.playout?.streams?.[streamKey]) throw Error(`Stream '${streamKey}' not found in playout.streams of Offering '${offeringKey}'.`)
    delete offeringMetadata.playout.streams[streamKey]
    if (!offeringMetadata.media_struct?.streams?.[streamKey]) throw Error(`Stream '${streamKey}' not found in media_struct.streams of Offering '${offeringKey}'.`)
    delete offeringMetadata.media_struct.streams[streamKey]

    // Write back metadata
    const newHash = await this.concerns.Metadata.write({
      commitMessage: `Delete stream '${streamKey}' from offering '${offeringKey}'`,
      libraryId,
      metadata: offeringMetadata,
      objectId,
      subtree: `/offerings/${offeringKey}`
    })
    logger.data('version_hash', newHash)
    logger.log('New version hash: ' + newHash)
  }

  header() {
    return `Delete stream '${this.args.streamKey}' from offering '${this.args.offeringKey}' in object ${this.args.objectId}.`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(OfferingDeleteStream)
} else {
  module.exports = OfferingDeleteStream
}
