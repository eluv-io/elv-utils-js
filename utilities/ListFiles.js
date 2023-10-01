// Retrieve file list from object
const Utility = require('./lib/Utility')

const ExistObjOrVer = require('./lib/concerns/kits/ExistObjOrVer')
const FabricFile = require('./lib/concerns/FabricFile')
const ArgOutfile = require('./lib/concerns/ArgOutfile')

class ListFiles extends Utility {
  static blueprint() {
    return {
      concerns: [ExistObjOrVer, FabricFile, ArgOutfile]
    }
  }

  async body() {
    const {outfile} = this.args
    const {libraryId, objectId, versionHash} = await this.concerns.ExistObjOrVer.argsProc()

    const itemList = await this.concerns.FabricFile.itemList({libraryId, objectId, versionHash})
    this.logger.data('files', itemList)

    if(outfile) {
      this.concerns.ArgOutfile.writeJson(itemList)
    } else {
      this.logger.logTable({list: itemList})
    }

    if(itemList.length === 0) this.logger.warn('No files or directories found.')
  }

  header() {
    return `Get file/directory list for ${this.args.versionHash || this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(ListFiles)
} else {
  module.exports = ListFiles
}
