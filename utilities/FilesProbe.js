// Probe file in object for media structure
'use strict'

const {NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgOutfile = require('./lib/concerns/args/ArgOutfile.js')
const Client = require('./lib/concerns/Client')
const CloudAccess = require('./lib/concerns/kits/CloudAccess')
const ExistLibOrObjOrVerOrDft = require('./lib/concerns/kits/ExistLibOrObjOrVerOrDft')

class FilesProbe extends Utility {
  static blueprint() {
    return {
      concerns: [Client, ExistLibOrObjOrVerOrDft, ArgOutfile, CloudAccess],
      options: [
        NewOpt('files', {
          demand: true,
          descTemplate: 'File path(s) within object.',
          string: true,
          type: 'array'
        })
      ]
    }
  }

  async body() {
    const {files, outfile} = this.args
    const client = await this.concerns.Client.get()

    const access = this.concerns.CloudAccess.remoteAccessList(false)

    const {libraryId, objectId, versionHash, writeToken} = await this.concerns.ExistLibOrObjOrVerOrDft.argsProc()

    const {data, errors, warnings} = await client.CallBitcodeMethod({
      libraryId,
      objectId,
      versionHash,
      writeToken,
      method: '/media/files/probe',
      constant: false,
      body: {file_paths: files, access}
    })

    if(outfile) {
      this.concerns.ArgOutfile.writeJson(data)
    } else {
      this.logger.logObject(data)
    }
    this.logger.data('filesMediaInfo', data)
    this.logger.errorsAndWarnings({errors, warnings})
  }

  header() {
    return `Get media info for file(s) in ${this.args.versionHash || this.args.objectId}...`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(FilesProbe)
} else {
  module.exports = FilesProbe
}
