// Retrieve file list from object
'use strict'
const Utility = require('./lib/Utility')

const {fabricItemDesc} = require('./lib/helpers')

const ExistObjOrVerOrDft = require('./lib/concerns/kits/ExistObjOrVerOrDft')
const FabricFile = require('./lib/concerns/FabricFile')
const ArgOutfile = require('./lib/concerns/args/ArgOutfile.js')

class ListFiles extends Utility {
  static blueprint() {
    return {
      concerns: [ExistObjOrVerOrDft, FabricFile, ArgOutfile]
    }
  }

  async body() {
    const {outfile} = this.args
    const {libraryId, objectId, versionHash, writeToken} = await this.concerns.ExistObjOrVerOrDft.argsProc()

    const fileList = await this.concerns.FabricFile.fileList({libraryId, objectId, versionHash, writeToken})
    this.logger.data('files', fileList)

    if(outfile) {
      this.concerns.ArgOutfile.writeJson(fileList)
    } else {
      this.logger.logTable({list: fileList})
    }

    if(fileList.length === 0) this.logger.warn('No files found.')
  }

  header() {
    return `Get file list for ${fabricItemDesc(this.args)}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(ListFiles)
} else {
  module.exports = ListFiles
}
