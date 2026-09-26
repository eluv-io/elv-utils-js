// thumbnails/create

const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const ExistObjOrDft = require('./lib/concerns/kits/ExistObjOrDft')
const Logger = require('./lib/concerns/Logger')
const ArgOfferingKey = require('./lib/concerns/args/ArgOfferingKey')
const PositiveIntModel = require('@eluvio/elv-js-helpers/Model/PositiveIntModel')

class OfferingAddThumbnails extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ExistObjOrDft, Client, ArgOfferingKey],
      options: [
        ModOpt('writeToken', {ofX: 'offering'}),
        ModOpt('objectId', {ofX: 'offering'}),
        ModOpt('libraryId', {forX: 'offering'}),
        NewOpt('targetThumbCount', {
          descTemplate: 'Number of thumbnails to create',
          coerce: PositiveIntModel,
          type: 'number'
        }),
        NewOpt('thumbHeight', {
          descTemplate: 'Thumbnail height in pixels',
          coerce: PositiveIntModel,
          type: 'number'
        })
      ]
    }
  }

  async body() {
    const client = await this.concerns.Client.get()
    const logger = this.logger

    let {libraryId, objectId, writeToken, offeringKey, targetThumbCount, thumbHeight} = await this.concerns.ExistObjOrDft.argsProc()
    const writeTokenSupplied = !!writeToken

    if (!writeTokenSupplied) writeToken = await this.concerns.Edit.getWriteToken({libraryId, objectId}).writeToken

    const {errors, warnings} = await client.CallBitcodeMethod({
      writeToken,
      objectId,
      libraryId,
      method: '/media/thumbnails/create',
      constant: false, // needs to be a POST, it modifies object
      body: {
        offeringKey,
        target_thumb_count: targetThumbCount || 100,
        thumb_height: thumbHeight || -1
      }
    })
    this.logger.errorsAndWarnings({errors, warnings})

    // finalize if token not supplied
    if (writeTokenSupplied) {
      logger.log('Write token NOT finalized')
    } else {
      const newHash = await this.concerns.Edit.finalize({
        commitMessage: `Generate thumbnail/storyboard stream for offering '${offeringKey}'`,
        libraryId,
        objectId,
        writeToken
      })

      logger.data('version_hash', newHash)
      logger.log('New version hash: ' + newHash)
    }
  }

  header() {
    return `Generate thumbnail/storyboard stream for offering '${this.args.offeringKey}'`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(OfferingAddThumbnails)
} else {
  module.exports = OfferingAddThumbnails
}
