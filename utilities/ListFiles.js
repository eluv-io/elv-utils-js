// Retrieve file list from object
const Utility = require('./lib/Utility')

const ExistObjOrVerOrDft = require('./lib/concerns/kits/ExistObjOrVerOrDft')
const FabricFile = require('./lib/concerns/libs/FabricFile')
const ArgOutfile = require('./lib/concerns/args/ArgOutfile')
const ArgFilePath = require('./lib/concerns/args/ArgFilePath')

class ListFiles extends Utility {
  static blueprint() {
    return {
      concerns: [ExistObjOrVerOrDft, FabricFile, ArgOutfile, ArgFilePath]
    }
  }

  async body() {
    const {outfile, filePath} = this.args
    const {libraryId, objectId, versionHash, writeToken} = await this.concerns.ExistObjOrVerOrDft.argsProc()

    const fileList = await this.concerns.FabricFile.fileList({filePath, libraryId, objectId, versionHash, writeToken})
    this.logger.data('files', fileList)

    if(outfile) {
      this.concerns.ArgOutfile.writeJson(fileList)
    } else {
      this.logger.logTable({list: fileList})
    }

    if(fileList.length === 0) this.logger.warn('No files found.')
  }

  header() {
    return `Get file list for ${this.args.versionHash || this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(ListFiles)
} else {
  module.exports = ListFiles
}
