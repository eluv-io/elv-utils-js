// Retrieve part list from object
'use strict'
const Utility = require('./lib/Utility')

const ExistObjOrVerOrDft = require('./lib/concerns/kits/ExistObjOrVerOrDft')
const ArgOutfile = require('./lib/concerns/args/ArgOutfile.js')

class ListParts extends Utility {
  static blueprint() {
    return {
      concerns: [ExistObjOrVerOrDft, ArgOutfile]
    }
  }

  async body() {
    const {outfile} = this.args
    const partList = await this.concerns.ExistObjOrVerOrDft.partList()
    this.logger.data('parts', partList)

    if(outfile) {
      this.concerns.ArgOutfile.writeJson(partList)
    } else {
      this.logger.logTable({list: partList})
    }

    if(partList.length === 0) this.logger.warn('No parts found.')
  }

  header() {
    return `Get part list for ${this.args.versionHash || this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(ListParts)
} else {
  module.exports = ListParts
}
