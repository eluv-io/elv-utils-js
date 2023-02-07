// Set or clear text watermark for an offering

const Utility = require('./lib/Utility')

const TextWatermarkModel = require('./lib/models/TextWatermarkModel')

const ArgClear = require('./lib/concerns/ArgClear')
const ArgOfferingKey = require('./lib/concerns/ArgOfferingKey')
const ArgWatermark = require('./lib/concerns/ArgWatermark')
const ExistObj = require('./lib/concerns/ExistObj')
const FabricFile = require('./lib/concerns/FabricFile')
const Metadata = require('./lib/concerns/Metadata')

const chkNoClearOrWatermark = (argv) => {
  if (!argv.clear && !argv.watermark) {
    throw Error('Must supply either --watermark or --clear')
  }
  return true // tell yargs that the arguments passed the check
}

class OfferingSetTextWatermark extends Utility {
  blueprint() {
    return {
      concerns: [
        ExistObj,
        Metadata,
        ArgOfferingKey,
        ArgWatermark,
        ArgClear,
        FabricFile
      ],
      checksMap: {chkNoClearOrWatermark}
    }
  }

  async body() {
    const logger = this.logger
    const watermark = this.args.watermark && TextWatermarkModel( this.concerns.ArgWatermark.asObject())

    const {offeringKey, clear} = this.args

    // operations that may need to wait on network access
    // ----------------------------------------------------
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    logger.log('Retrieving existing offering metadata from object...')
    const subtree = `/offerings/${offeringKey}`
    const currentOffering = await this.concerns.ExistObj.metadata({subtree})

    if (!currentOffering) throw Error(`Offering '${offeringKey}' not found.`)

    let newHash

    if (clear) {
      if (!currentOffering.simple_watermark) throw Error(`Offering '${offeringKey}' does not currently have a text watermark.`)
      newHash = this.concerns.Metadata.del({
        commitMessage: 'Remove text watermark',
        libraryId,
        objectId,
        subtree: subtree + '/simple_watermark'
      })
    } else {
      if (currentOffering.image_watermark) throw Error(`Offering '${offeringKey}' currently has an image watermark. Please remove first with 'OfferingSetImageWatermark.js --clear'`)

      newHash = await this.concerns.Metadata.write({
        commitMessage: 'Set text watermark',
        libraryId,
        metadata: watermark,
        objectId,
        subtree: subtree + '/simple_watermark'
      })
    }

    this.logger.data('version_hash', newHash)
    this.logger.log(`New Version Hash: ${newHash}`)
  }

  header() {
    return this.args.clear
      ? `Clear text watermark from offering '${this.args.offeringKey}' in object ${this.args.objectId}`
      : `Set text watermark for offering '${this.args.offeringKey}' in object ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(OfferingSetTextWatermark)
} else {
  module.exports = OfferingSetTextWatermark
}
