// Replace metadata at a key
'use strict'
const objectPath = require('object-path')

const clone = require('@eluvio/elv-js-helpers/Functional/clone')

const {fabricItemDesc} = require('./lib/helpers')
const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgMetadata = require('./lib/concerns/ArgMetadata')
const ArgPath = require('./lib/concerns/args/ArgPath')
const ExistLibOrObjOrDft = require('./lib/concerns/kits/ExistLibOrObjOrDft')
const Metadata = require('./lib/concerns/Metadata')
const Write = require('./lib/concerns/kits/Write')

class MetaSet extends Utility {
  static blueprint() {
    return {
      concerns: [
        ExistLibOrObjOrDft,
        Metadata,
        ArgPath,
        ArgMetadata,
        Write
      ],
      options: [
        ModOpt('writeToken', {ofX: ' item to modify'}),
        ModOpt('objectId', {ofX: ' item to modify'}),
        ModOpt('libraryId', {ofX: ' item to modify'}),
        ModOpt('path', {
          demand: true,
          X: 'to set'
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
    const processedArgs = await this.concerns.ExistLibOrObjOrDft.argsProc()

    // create a write token if needed
    const writeInfo = await this.concerns.Write.prepare(processedArgs)

    const {
      commitMsg,
      finalize,
      libraryId,
      newDraftCreated,
      noFinalize,
      noWaitPublish,
      objectId,
      writeToken
    } = Object.assign(
      clone(processedArgs),
      writeInfo
    )

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

    let revisedMetadata = clone(currentMetadata)
    if (path === '/') {
      revisedMetadata = clone(metadataFromArg)
    } else {
      objectPath.set(revisedMetadata, Metadata.pathToArray({path}), metadataFromArg)
    }

    // Write back metadata
    await this.concerns.Metadata.write({
      libraryId,
      metadata: revisedMetadata,
      objectId,
      writeToken
    })

    await this.concerns.Write.conclude({
      commitMsg,
      defaultCommitMsg: `Set metadata path: '${path}'`,
      finalize,
      libraryId,
      newDraftCreated,
      noFinalize,
      noWaitPublish,
      objectId,
      writeToken
    })
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
