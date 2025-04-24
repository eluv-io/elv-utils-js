// Set or clear image watermark for an offering
'use strict'
const Utility = require('./lib/Utility')

const ImageWatermarkModel = require('./lib/models/ImageWatermarkModel')

const ArgClear = require('./lib/concerns/args/ArgClear')
const ArgOfferingKey = require('./lib/concerns/args/ArgOfferingKey')
const ArgWatermark = require('./lib/concerns/ArgWatermark')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const FabricFile = require('./lib/concerns/FabricFile')
const Metadata = require('./lib/concerns/Metadata')

const chkNoClearOrWatermark = (argv) => {
  if (!argv.clear && !argv.watermark) {
    throw Error('Must supply either --watermark or --clear')
  }
  return true // tell yargs that the arguments passed the check
}


class OfferingSetImageWatermark extends Utility {
  static blueprint() {
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
    const watermark = this.args.watermark && ImageWatermarkModel( this.concerns.ArgWatermark.asObject())

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
      if (!currentOffering.image_watermark) throw Error(`Offering '${offeringKey}' does not currently have an image watermark.`)
      newHash = this.concerns.Metadata.del({
        commitMessage: 'Remove image watermark',
        libraryId,
        objectId,
        subtree: subtree + '/image_watermark'
      })
    } else {
      if (currentOffering.simple_watermark) throw Error(`Offering '${offeringKey}' currently has a text watermark. Please remove first with 'OfferingSetTextWatermark.js --clear'`)
      const currentHash = await this.concerns.ArgObjectId.objLatestHash()
      // check that file exists
      const filePath = watermark.image
      const pathInfo = await this.concerns.FabricFile.pathInfo({
        libraryId,
        objectId,
        filePath
      })

      if (!pathInfo) throw Error(`File '${filePath}' not found in object`)
      if (FabricFile.isLink(pathInfo)) throw Error(`File '${filePath}' is a remote link`)
      if (FabricFile.isDir(pathInfo)) throw Error(`'${filePath}' is a directory`)
      if (!FabricFile.isFile(pathInfo)) throw Error(`'${filePath}' is not a file`)
      if (!pathInfo['.']?.size ) throw Error(`'${filePath}' has no size`)

      // convert watermark.image into a link
      watermark.image = `/qfab/${currentHash}/files${filePath}`
      newHash = await this.concerns.Metadata.write({
        commitMessage: 'Set image watermark',
        libraryId,
        metadata: watermark,
        objectId,
        subtree: subtree + '/image_watermark'
      })
    }

    this.logger.data('version_hash', newHash)
    this.logger.log(`New Version Hash: ${newHash}`)
  }

  header() {
    return this.args.clear
      ? `Clear image watermark from offering '${this.args.offeringKey}' in object ${this.args.objectId}`
      : `Set image watermark for offering '${this.args.offeringKey}' in object ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(OfferingSetImageWatermark)
} else {
  module.exports = OfferingSetImageWatermark
}
