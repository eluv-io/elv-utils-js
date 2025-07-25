// go through offerings and create full set of DRM keys for every audio/video stream
'use strict'

const R = require('@eluvio/ramda-fork')

const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const Edit = require('./lib/concerns/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const Metadata = require('./lib/concerns/libs/Metadata.js')

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
    const metadata = await this.concerns.ExistObj.metadata()

    if(!metadata.offerings || R.isEmpty(metadata.offerings)) throw Error('no offerings found in metadata')

    // get write token
    const {writeToken} = await this.concerns.Edit.getWriteToken({libraryId, objectId})

    const client = await this.concerns.Client.get()

    // loop through offerings
    for(const [offeringKey, offering] of Object.entries(metadata.offerings)) {
      logger.log(`  Processing offering '${offeringKey}'...`)
      if(offering.store_clear){
        logger.log(`    Offering '${offeringKey}' has "store_clear": true, skipping...`)
      } else {
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

    // Finalize
    const newHash = await this.concerns.Edit.finalize({
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
