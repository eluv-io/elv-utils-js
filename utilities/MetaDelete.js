// Delete a metadata path from an object
'use strict'
const objectPath = require('object-path')
const R = require('@eluvio/ramda-fork')

const {fabricItemDesc} = require('./lib/helpers')
const {ModOpt, NewOpt} = require('./lib/options')

const Utility = require('./lib/Utility')

const ArgCommitMsg = require('./lib/concerns/args/ArgCommitMsg')
const ExistLibOrObjOrDft = require('./lib/concerns/kits/ExistLibOrObjOrDft')
const Metadata = require('./lib/concerns/Metadata')

class MetaDelete extends Utility {
  static blueprint() {
    return {
      concerns: [ArgCommitMsg, ExistLibOrObjOrDft, Metadata],
      options: [
        ModOpt('writeToken', {ofX: ' item to modify'}),
        ModOpt('objectId', {ofX: ' item to modify'}),
        ModOpt('libraryId', {ofX: ' item to modify'}),
        ModOpt('commitMsg', {conflicts: 'writeToken'}),
        NewOpt('path', {
          demand: true,
          descTemplate: 'Metadata path to delete (include leading \'/\')',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const {path} = this.args

    // Check that paths are valid path strings
    Metadata.validatePathFormat({path})

    const {libraryId, objectId, writeToken} = await this.concerns.ExistLibOrObjOrDft.argsProc()
    const commitMessage = this.args.commitMsg || (
      this.args.writeToken
        ? undefined
        : `Delete metadata path: '${path}'`
    )
    const currentMetadata = await this.concerns.ExistObj.metadata()

    // check to make sure path exists
    if (!Metadata.pathExists({
      metadata: currentMetadata,
      path
    })) throw new Error(`Metadata path '${path}' not found.`)

    // delete path
    const revisedMetadata = R.clone(currentMetadata)
    objectPath.del(revisedMetadata, Metadata.pathToArray({path}))

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
    return `Delete metadata path '${this.args.path}' from ${fabricItemDesc(this.args)}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(MetaDelete)
} else {
  module.exports = MetaDelete
}
