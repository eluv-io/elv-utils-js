// thumbnails/create

const {ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const Logger = require('./lib/concerns/Logger')
const ArgOfferingKey = require('./lib/concerns/args/ArgOfferingKey')

class OfferingAddThumbnails extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ExistObj, Client, ArgOfferingKey],
      options: [
        ModOpt('objectId', {ofX: 'offering'}),
        ModOpt('libraryId', {forX: 'offering'})
      ]
    }
  }

  async body() {
    const client = await this.concerns.Client.get()
    const logger = this.logger

    const {libraryId, objectId, offeringKey} = await this.concerns.ArgObjectId.argsProc()

    const {writeToken} = await this.concerns.Edit.getWriteToken({libraryId, objectId})

    const {errors, warnings} = await client.CallBitcodeMethod({
      writeToken,
      objectId,
      libraryId,
      method: '/media/thumbnails/create',
      constant: false, // needs to be a POST in case S3 credentials are needed
      body: {offeringKey}
    })
    this.logger.errorsAndWarnings({errors, warnings})

    // finalize
    const newHash = await this.concerns.Edit.finalize({
      commitMessage: `Generate thumbnail/storyboard stream for offering '${offeringKey}'`,
      libraryId,
      objectId,
      writeToken
    })

    logger.data('version_hash', newHash)
    logger.log('New version hash: ' + newHash)
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
