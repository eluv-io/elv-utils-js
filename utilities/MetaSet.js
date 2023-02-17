// Replace metadata at a key
const objectPath = require('object-path')
const R = require('@eluvio/ramda-fork')

const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ExistObj = require('./lib/concerns/kits/ExistObj')
const Metadata = require('./lib/concerns/Metadata')
const ArgMetadata = require('./lib/concerns/ArgMetadata')

class MetaSet extends Utility {
  static blueprint() {
    return {
      concerns: [
        ExistObj,
        Metadata,
        ArgMetadata
      ],
      options: [
        NewOpt('path', {
          demand: true,
          descTemplate: 'Path within metadata to set (start with \'/\').',
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
    Metadata.validatePathFormat({path})

    const metadataFromArg = this.concerns.ArgMetadata.asObject()

    // operations that may need to wait on network access
    // ----------------------------------------------------
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    logger.log('Retrieving existing metadata from object...')
    const currentMetadata = await this.concerns.ExistObj.metadata()

    // check that targetPath can be set
    Metadata.validateTargetPath({
      metadata: currentMetadata,
      path
    })

    // make sure targetPath does NOT exist, or --force specified
    this.concerns.Metadata.checkTargetPath({
      force,
      metadata: currentMetadata,
      targetPath: path
    })

    const revisedMetadata = R.clone(currentMetadata)
    objectPath.set(revisedMetadata, Metadata.pathToArray({path}), metadataFromArg)

    // Write back metadata
    const newHash = await this.concerns.Metadata.write({
      libraryId,
      metadata: revisedMetadata,
      objectId
    })
    this.logger.data('version_hash', newHash)
  }

  header() {
    return `Set metadata ${this.args.path ? `at ${this.args.path} ` : ''}for object ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MetaSet)
} else {
  module.exports = MetaSet
}
