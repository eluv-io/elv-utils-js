// Retrieve metadata from object
const kindOf = require('kind-of')

const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const JPath = require('./lib/concerns/JPath')
const Metadata = require('./lib/concerns/Metadata')
const ExistObjOrVer = require('./lib/concerns/ExistObjOrVer')
const ArgOutfile = require('./lib/concerns/ArgOutfile')

class MetaGet extends Utility {
  static blueprint() {
    return {
      concerns: [JPath, ExistObjOrVer, ArgOutfile],
      options: [
        ModOpt('jpath', {X: 'to extract'}),
        NewOpt('path', {
          descTemplate: 'Path within metadata to retrieve (include leading \'/\'). If omitted, all visible metadata is retrieved.',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const {path, outfile} = this.args

    // Check that keys are valid path strings
    if (path) Metadata.validatePathFormat({path})

    await this.concerns.ExistObjOrVer.argsProc()

    const metadata = await this.concerns.ExistObjOrVer.metadata({subtree: path})
    if (kindOf(metadata) === 'undefined') throw Error('no metadata found')
    const filteredMetadata = this.args.jpath
      ? this.concerns.JPath.match({metadata})
      : metadata
    if (kindOf(filteredMetadata) === 'undefined') throw Error('no metadata matched --jpath filter')

    if (outfile) {
      this.concerns.ArgOutfile.writeJson({obj: filteredMetadata})
    } else {
      this.logger.log()
      this.logger.logObject(filteredMetadata)
    }
    this.logger.data('metadata', filteredMetadata)
  }

  header() {
    return `Get metadata for ${this.args.versionHash || this.args.objectId}${this.args.path ? ` path: ${this.args.path}` : ''}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(MetaGet)
} else {
  module.exports = MetaGet
}
