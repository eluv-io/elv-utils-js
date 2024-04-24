// Replace metadata at a key
const objectPath = require('object-path')
const R = require('@eluvio/ramda-fork')

const {fabricItemDesc} = require('./lib/helpers')
const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ExistLibOrObjOrDft = require('./lib/concerns/kits/ExistLibOrObjOrDft')
const Metadata = require('./lib/concerns/Metadata')
const ArgMetadata = require('./lib/concerns/ArgMetadata')
const ArgCommitMsg = require('./lib/concerns/args/ArgCommitMsg')

class MetaSet extends Utility {
  static blueprint() {
    return {
      concerns: [
        ExistLibOrObjOrDft,
        Metadata,
        ArgMetadata,
        ArgCommitMsg
      ],
      options: [
        ModOpt('writeToken', {ofX: ' item to modify'}),
        ModOpt('objectId', {ofX: ' item to modify'}),
        ModOpt('libraryId', {ofX: ' item to modify'}),
        NewOpt('path', {
          demand: true,
          descTemplate: 'Path within metadata to set (start with \'/\').',
          type: 'string'
        }),
        NewOpt('force', {
          descTemplate: 'If target metadata path within object exists, overwrite and replace',
          type: 'boolean'
        }),
        ModOpt('metadata', {demand:true}),
        ModOpt('commitMsg', {conflicts: 'writeToken'}),
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {path, force} = this.args

    const commitMessage = this.args.commitMsg || (
      this.args.writeToken
        ? undefined
        : `Set metadata path: '${path}'`
    )
    // Check that path is a valid path string
    Metadata.validatePathFormat({path})

    const metadataFromArg = this.concerns.ArgMetadata.asObject()

    // operations that may need to wait on network access
    // ----------------------------------------------------
    const {libraryId, objectId, writeToken} = await this.concerns.ExistLibOrObjOrDft.argsProc()

    logger.log('Retrieving existing metadata from object...')
    const currentMetadata = await this.concerns.ExistLibOrObjOrDft.metadata()

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
      commitMessage,
      libraryId,
      metadata: revisedMetadata,
      objectId,
      writeToken
    })

    if (!writeToken) this.logger.data('version_hash', newHash)
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
