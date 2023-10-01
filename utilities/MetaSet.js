// Replace metadata at a key
const objectPath = require('object-path')
const R = require('@eluvio/ramda-fork')

const {fabricItemDesc} = require('./lib/helpers')
const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ExistObjOrDft = require('./lib/concerns/kits/ExistObjOrDft')
const Metadata = require('./lib/concerns/Metadata')
const ArgMetadata = require('./lib/concerns/ArgMetadata')

class MetaSet extends Utility {
  static blueprint() {
    return {
      concerns: [
        ExistObjOrDft,
        Metadata,
        ArgMetadata
      ],
      options: [
        NewOpt('path', {
          descTemplate: 'Path within metadata to set (include leading \'/\'). If omitted, all metadata is replaced.',
          type: 'string'
        }),
        NewOpt('force', {
          descTemplate: 'If target metadata path within object exists, overwrite and replace',
          type: 'boolean'
        }),
        ModOpt('metadata', {demand:true})
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {path, force} = this.args

    // Check that path is a valid path string
    if (path) Metadata.validatePathFormat({path})

    // If --path not specified, make sure --force was
    if (!path && !force) {
      throw Error('If you wish to replace all metadata by omitting --path, you must use --force')
    }

    const metadataFromArg = this.concerns.ArgMetadata.asObject()

    // operations that may need to wait on network access
    // ----------------------------------------------------
    const {libraryId, objectId, writeToken} = await this.concerns.ExistObjOrDft.argsProc()

    logger.log('Retrieving existing metadata from object...')
    const currentMetadata = await this.concerns.ExistObjOrDft.metadata()

    // check that targetPath can be set
    if (path) Metadata.validateTargetPath({
      metadata: currentMetadata,
      path
    })

    // make sure targetPath does NOT exist, or --force specified
    if (path) this.concerns.Metadata.checkTargetPath({
      force,
      metadata: currentMetadata,
      targetPath: path
    })

    const revisedMetadata = path
      ? R.clone(currentMetadata)
      : metadataFromArg

    if (path) {
      objectPath.set(revisedMetadata, Metadata.pathToArray({path}), metadataFromArg)
    }

    // Write back metadata
    const newHash = await this.concerns.Metadata.write({
      libraryId,
      metadata: revisedMetadata,
      objectId,
      writeToken
    })
    this.logger.data('version_hash', newHash)
  }

  header() {
    return `Set metadata ${this.args.path ? `at ${this.args.path} ` : ''}for ${fabricItemDesc(this.args)}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MetaSet)
} else {
  module.exports = MetaSet
}
