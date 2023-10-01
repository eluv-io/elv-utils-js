// Retrieve metadata from lib/obj/ver/dft
const isUndefined = require('@eluvio/elv-js-helpers/Boolean/isUndefined')

const {fabricItemDesc} = require('./lib/helpers')
const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const JPath = require('./lib/concerns/JPath')
const Metadata = require('./lib/concerns/Metadata')
const ExistLibOrObjOrVerOrDft = require('./lib/concerns/kits/ExistLibOrObjOrVerOrDft')
const ArgOutfile = require('./lib/concerns/ArgOutfile')
const ArgResolve = require('./lib/concerns/args/ArgResolve')

class MetaGet extends Utility {
  static blueprint() {
    return {
      concerns: [JPath, ExistLibOrObjOrVerOrDft, ArgOutfile, ArgResolve],
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
    const {path, outfile, resolve} = this.args

    // Check that keys are valid path strings
    if (path) Metadata.validatePathFormat({path})

    await this.concerns.ExistLibOrObjOrVerOrDft.argsProc()

    const metadata = await this.concerns.ExistLibOrObjOrVerOrDft.metadata({
      subtree: path,
      resolve
    })
    if (isUndefined(metadata)) throw Error('no metadata found')
    const filteredMetadata = this.args.jpath
      ? this.concerns.JPath.match({metadata})
      : metadata
    if (isUndefined(filteredMetadata)) throw Error('no metadata matched --jpath filter')

    if (outfile) {
      this.concerns.ArgOutfile.writeJson({obj: filteredMetadata})
    } else {
      this.logger.log()
      this.logger.logObject(filteredMetadata)
    }
    this.logger.data('metadata', filteredMetadata)
  }

  header() {
    return `Get metadata for ${fabricItemDesc(this.args)}${this.args.path ? ` path: ${this.args.path}` : ''}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(MetaGet)
} else {
  module.exports = MetaGet
}
