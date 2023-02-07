// Set display image for an object

const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ExistObj = require('./lib/concerns/ExistObj')
const FabricFile = require('./lib/concerns/FabricFile')
const Metadata = require('./lib/concerns/Metadata')
const ArgFilePath = require('./lib/concerns/ArgFilePath')

const chkNoClearOrFilePath = (argv) => {
  if (!argv.clear && !argv.filePath) {
    throw Error('Must supply either --filePath or --clear')
  }
  return true // tell yargs that the arguments passed the check
}

class ImageSet extends Utility {
  blueprint() {
    return {
      concerns: [
        ExistObj,
        Metadata,
        FabricFile,
        ArgFilePath
      ],
      options: [
        ModOpt('filePath', {
          X: 'image',
          conflicts: ['clear']
        }),
        NewOpt('clear', {
          descTemplate: 'Clear image setting for object',
          type: 'boolean'
        })
      ],
      checksMap: {chkNoClearOrFilePath}
    }
  }

  async body() {
    const logger = this.logger
    const {filePath, clear} = this.args
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    let newHash

    if (clear) {
      newHash = await this.concerns.Metadata.del({
        commitMessage: 'Clear display image',
        libraryId,
        objectId,
        subtree: '/public/display_image'
      })
    } else {
      logger.log('Checking that file exists...')
      const pathInfo = await this.concerns.FabricFile.pathInfo({
        filePath,
        libraryId,
        objectId
      })

      if (!pathInfo) throw Error(`File '${filePath}' not found in object`)
      if (FabricFile.isLink(pathInfo)) throw Error(`File '${filePath}' is a remote link`)
      if (FabricFile.isDir(pathInfo)) throw Error(`'${filePath}' is a directory`)
      if (!FabricFile.isFile(pathInfo)) throw Error(`'${filePath}' is not a file`)
      if (!pathInfo['.']?.size ) throw Error(`'${filePath}' has no size`)

      newHash = await this.concerns.Metadata.write({
        commitMessage: `Set display image to '${filePath}'`,
        libraryId,
        metadata: {'/': `./files${filePath}`},
        objectId,
        subtree: '/public/display_image'
      })
    }

    this.logger.data('version_hash', newHash)
    this.logger.log(`New Version Hash: ${newHash}`)
  }

  header() {
    return this.args.clear
      ? `Clear display image from object ${this.args.objectId}`
      : `Set display image for object ${this.args.objectId} to ${this.args.filePath}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(ImageSet)
} else {
  module.exports = ImageSet
}
