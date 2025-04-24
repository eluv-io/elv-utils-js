// List all libraries visible to the current private key
'use strict'

const {NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const Library = require('./lib/concerns/libs/Library')
const Logger = require('./lib/concerns/kits/Logger.js')

class ListLibraries extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, Library],
      options: [
        NewOpt('name', {
          descTemplate: 'include library name if available',
          type: 'boolean'
        })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const libList = await this.concerns.Library.list()

    const formattedLibList = []
    this.logger.log(`Found ${libList.length} lib(s)`)
    for(let i = 0; i < libList.length; i++) {
      const e = libList[i]
      const formattedLib = {libraryId: e}
      if (this.args.name) formattedLib.name = await this.concerns.Library.name({libraryId: e})
      formattedLibList.push(formattedLib)
    }

    logger.data('libraries', formattedLibList)

    logger.logTable({list: formattedLibList})
    if(libList.length === 0) logger.warn('No visible libraries found using supplied private key.')
  }

  header() {
    return 'Get list of libraries'
  }

}

if(require.main === module) {
  Utility.cmdLineInvoke(ListLibraries)
} else {
  module.exports = ListLibraries
}
