// go through offerings and create full set of DRM keys for every audio/video stream

const R = require('@eluvio/ramda-fork')
const clone = require('@eluvio/elv-js-helpers/Functional/clone')

const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const Edit = require('./lib/concerns/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const Metadata = require('./lib/concerns/Metadata')

class MezRegenDrmKeys extends Utility {
  static blueprint() {
    return {
      concerns: [
        Client, ExistObj, Metadata, Edit
      ]
    }
  }

  async body() {
    const logger = this.logger

    // operations that need to wait on network access
    // ----------------------------------------------------
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    logger.log('Retrieving existing metadata from object...')
    const originalMetadata = await this.concerns.ExistObj.metadata()

    if(!originalMetadata.offerings || R.isEmpty(originalMetadata.offerings)) throw Error('no offerings found in metadata')

    // make a copy
    let workingCopy = clone(originalMetadata)

    logger.log('Removing current DRM keys and playout formats from current metadata...')
    logger.log('  /elv/crypt/drm/kids...')
    if (workingCopy.elv?.crypt?.drm?.kids) workingCopy.elv.crypt.drm.kids = {}

    // loop through offerings and remove keys
    for(const [offeringKey, offering] of Object.entries(workingCopy.offerings)) {
      logger.log(`  /offerings/${offeringKey}/playout/drm_keys...`)
      if (offering.playout.drm_keys) offering.playout.drm_keys = {}

      // set DRM optional true
      offering.drm_optional = true

      // replace playout formats with hls-clear
      offering.playout.playout_formats = {
        'hls-clear': {
          drm: null,
          protocol: {
            type: 'ProtoHls'
          }
        }
      }

      for(const [streamKey, stream] of Object.entries(offering.playout.streams)) {
        logger.log(`  /offerings/${offeringKey}/playout/stream/${streamKey}/encryption_schemes...`)
        if (stream.encryption_schemes) stream.encryption_schemes = {}
      }
    }

    // get write token
    const {writeToken} = await this.concerns.Edit.getWriteToken({libraryId, objectId})

    const client = await this.concerns.Client.get()

    // write metadata with keys stripped
    logger.log('Writing back metadata with drm keys removed...')

    // Write back metadata
    await this.concerns.Metadata.write({
      libraryId,
      objectId,
      metadata: workingCopy,
      writeToken
    })

    // loop through offerings and call API
    for(const [offeringKey, offering] of Object.entries(workingCopy.offerings)) {
      logger.log(`  Processing offering '${offeringKey}'...`)
      if(offering.store_clear){
        logger.log(`    Offering '${offeringKey}' has "store_clear": true, skipping...`)
      } else {
        logger.log(`  Regenerating keys for offering '${offeringKey}'...`)
        const {errors, warnings, logs} = await client.CallBitcodeMethod({
          objectId,
          libraryId,
          method: `/media/offerings/${offeringKey}/regen_drm`,
          writeToken,
          constant: false
        })
        this.logger.errorsAndWarnings({errors, warnings})
        if(logs && logs.length > 0) this.logger.logList('Log:', logs)
      }
    }

    // get metadata with new keys
    logger.log('Reading metadata with new drm keys...')
    const metadataWithKeys = await this.concerns.Metadata.get({
      libraryId,
      objectId,
      writeToken
    })

    // loop through offerings and restore original drm_optional and playout_formats
    for(const [offeringKey, offering] of Object.entries(metadataWithKeys.offerings)) {
      logger.log(`  Restoring original playout formats to offering '${offeringKey}'...`)

      // restore original DRM optional
      offering.drm_optional = originalMetadata.offerings[offeringKey].drm_optional

      // restore original playout formats
      offering.playout.playout_formats = clone(originalMetadata.offerings[offeringKey].playout.playout_formats)
    }

    // write back metadata with restored formats
    logger.log('Writing back metadata with original playout_formats restored...')

    // Write back metadata
    await this.concerns.Metadata.write({
      libraryId,
      objectId,
      metadata: metadataWithKeys,
      writeToken
    })

    // Finalize
    const newHash = await this.concerns.Edit.finalize({
      commitMessage: 'Regenerate DRM keys',
      libraryId,
      objectId,
      writeToken
    })
    this.logger.data('version_hash', newHash)
    this.logger.log('New version hash: ' + newHash)
  }

  header() {
    return `Regenerate DRM keys for all offerings in object ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MezRegenDrmKeys)
} else {
  module.exports = MezRegenDrmKeys
}
