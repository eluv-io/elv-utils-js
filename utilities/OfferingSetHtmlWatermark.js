// Set or clear HTML watermark for an offering

const Utility = require('./lib/Utility')

const HtmlWatermarkModel = require('./lib/models/HtmlWatermarkModel')

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
  return true // Indicate that the argument check passed
}

class OfferingSetHtmlWatermark extends Utility {
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
    const watermark = this.args.watermark && HtmlWatermarkModel(this.concerns.ArgWatermark.asObject())

    const {offeringKey, clear} = this.args

    // Retrieve network-dependent identifiers and metadata
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()
    logger.log('Retrieving existing offering metadata from object...')
    const subtree = `/offerings/${offeringKey}`
    const currentOffering = await this.concerns.ExistObj.metadata({subtree})

    if (!currentOffering) throw Error(`Offering '${offeringKey}' not found.`)

    let newHash

    if (clear) {
      if (!currentOffering.html_watermark) {
        throw Error(`Offering '${offeringKey}' does not currently have an HTML watermark.`)
      }
      newHash = await this.concerns.Metadata.del({
        commitMessage: 'Remove HTML watermark',
        libraryId,
        objectId,
        subtree: subtree + '/html_watermark'
      })
    } else {
      // Enforce mutual exclusivity: no other watermark should be set
      if (currentOffering.simple_watermark || currentOffering.image_watermark) {
        throw Error(
          `Offering '${offeringKey}' already has a text or image watermark. Please remove it before setting an HTML watermark.`
        )
      }

      // Validate the HTML file exists
      const filePath = watermark.html
      const currentHash = await this.concerns.ArgObjectId.objLatestHash()
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

      // Convert watermark.html into a link
      watermark.html = `/qfab/${currentHash}/files${filePath}`

      newHash = await this.concerns.Metadata.write({
        commitMessage: 'Set HTML watermark',
        libraryId,
        metadata: watermark,
        objectId,
        subtree: subtree + '/html_watermark'
      })
    }

    this.logger.data('version_hash', newHash)
    this.logger.log(`New Version Hash: ${newHash}`)
  }

  header() {
    return this.args.clear
      ? `Clear HTML watermark from offering '${this.args.offeringKey}' in object ${this.args.objectId}`
      : `Set HTML watermark for offering '${this.args.offeringKey}' in object ${this.args.objectId}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(OfferingSetHtmlWatermark)
} else {
  module.exports = OfferingSetHtmlWatermark
}