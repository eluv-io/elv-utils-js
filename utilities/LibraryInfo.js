// List info about a library

const Utility = require('./lib/Utility')

const ExistLib = require('./lib/concerns/kits/ExistLib')
const Logger = require('./lib/concerns/kits/Logger')
const ArgOutfile = require('./lib/concerns/args/ArgOutfile')

class LibraryInfo extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ExistLib, ArgOutfile]
    }
  }

  async body() {
    const logger = this.logger
    await this.concerns.ExistLib.argsProc()
    const obj = await this.concerns.ExistLib.info()
    logger.data('libraryInfo', obj)
    if(this.args.outfile) {
      this.concerns.ArgOutfile.writeJson({obj})
    } else {
      this.logger.logObject(obj)
    }
  }

  header() {
    return `Get info for library ${this.args.libraryId}`
  }

}

if(require.main === module) {
  Utility.cmdLineInvoke(LibraryInfo)
} else {
  module.exports = LibraryInfo
}
