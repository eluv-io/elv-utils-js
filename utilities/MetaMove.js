// Move metadata from one path to another within a single object
const objectPath = require('object-path')
const R = require('@eluvio/ramda-fork')

const {ModOpt, NewOpt} = require('./lib/options')

const Utility = require('./lib/Utility')

const ExistObj = require('./lib/concerns/ExistObj')
const Metadata = require('./lib/concerns/Metadata')

class MetaMove extends Utility {
  blueprint() {
    return {
      concerns: [ExistObj, Metadata],
      options: [
        ModOpt('objectId', {ofX: ' item to modify'}),
        ModOpt('libraryId', {ofX: ' object to modify'}),
        NewOpt('path', {
          demand: true,
          descTemplate: 'Metadata path to the value to move (start with \'/\').',
          type: 'string'
        }),
        NewOpt('targetPath', {
          demand: true,
          descTemplate: 'Metadata path within object to move the value to (start with \'/\')',
          type: 'string'
        }),
        NewOpt('force', {
          descTemplate: 'If targetPath already exists, overwrite and replace existing value/subtree',
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

    // move value from path to targetPath
    const valueToMove = Metadata.valueAtPath({
      metadata: currentMetadata,
      path
    })
    const revisedMetadata = R.clone(currentMetadata)

    objectPath.del(revisedMetadata, Metadata.pathToArray({path}))
    objectPath.set(revisedMetadata, Metadata.pathToArray({path: targetPath}), valueToMove)

    // Write back metadata
    const newHash = await this.concerns.Metadata.write({
      libraryId,
      metadata: revisedMetadata,
      objectId
    })
    this.logger.data('version_hash', newHash)
  }

  header() {
    return `Move metadata for object ${this.args.objectId} from ${this.args.path} to ${this.args.targetPath}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MetaMove)
} else {
  module.exports = MetaMove
}
