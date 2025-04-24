// Copy metadata from one path to another within a single object
'use strict'
const objectPath = require('object-path')
const R = require('@eluvio/ramda-fork')

const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ExistObj = require('./lib/concerns/kits/ExistObj')
const Metadata = require('./lib/concerns/Metadata')

class MetaCopy extends Utility {
  static blueprint() {
    return {
      concerns: [ExistObj, Metadata],
      options: [
        ModOpt('objectId', {ofX: ' item to modify'}),
        ModOpt('libraryId', {ofX: ' object to modify'}),
        NewOpt('path', {
          demand: true,
          descTemplate: 'Metadata path to copy from (include leading \'/\')',
          type: 'string'
        }),
        NewOpt('targetPath', {
          demand: true,
          descTemplate: 'Metadata path to copy to (include leading \'/\')',
          type: 'string'
        }),
        NewOpt('force', {
          descTemplate: 'If target path already exists, overwrite existing value/subtree',
          type: 'boolean'
        })
      ]
    }
  }

  async body() {
    const {targetPath, path} = this.args

    // Check that paths are valid path strings
    Metadata.validatePathFormat({path})
    Metadata.validatePathFormat({path: targetPath})

    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()
    const currentMetadata = await this.concerns.ExistObj.metadata()

    // check to make sure path exists
    Metadata.validatePathExists({metadata: currentMetadata, path})

    // check that targetPath can be set/created
    Metadata.validateTargetPath({
      metadata: currentMetadata,
      path: targetPath
    })

    // make sure targetPath does NOT exist, or --force specified
    this.concerns.Metadata.checkTargetPath({
      force: this.args.force,
      metadata: currentMetadata,
      targetPath
    })

    // copy path to targetPath
    const valueToCopy = Metadata.valueAtPath({
      metadata: currentMetadata,
      path
    })
    const revisedMetadata = R.clone(currentMetadata)
    objectPath.set(revisedMetadata, Metadata.pathToArray({path: targetPath}), valueToCopy)

    // Write back metadata
    const newHash = await this.concerns.Metadata.write({
      libraryId,
      metadata: revisedMetadata,
      objectId
    })
    this.logger.data('version_hash', newHash)
  }

  header() {
    return `Copy metadata for object ${this.args.objectId} from ${this.args.path} to ${this.args.targetPath}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MetaCopy)
} else {
  module.exports = MetaCopy
}
