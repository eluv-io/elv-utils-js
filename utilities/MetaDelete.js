// Delete a metadata path from an object
const objectPath = require('object-path')
const R = require('@eluvio/ramda-fork')

const {ModOpt, NewOpt} = require('./lib/options')

const Utility = require('./lib/Utility')

const ExistObj = require('./lib/concerns/kits/ExistObj')
const Metadata = require('./lib/concerns/Metadata')

class MetaDelete extends Utility {
  static blueprint() {
    return {
      concerns: [ExistObj, Metadata],
      options: [
        ModOpt('objectId', {ofX: ' item to modify'}),
        ModOpt('libraryId', {ofX: ' object to modify'}),
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

    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()
    const currentMetadata = await this.concerns.ExistObj.metadata()

    // check to make sure path exists
    if(!Metadata.pathExists({
      metadata: currentMetadata,
      path
    })) throw new Error(`Metadata path '${path}' not found.`)

    // delete path
    const revisedMetadata = R.clone(currentMetadata)
    objectPath.del(revisedMetadata, Metadata.pathToArray({path}))

    // Write back metadata
    const newHash = await this.concerns.Metadata.write({
      libraryId,
      metadata: revisedMetadata,
      objectId
    })
    this.logger.data('version_hash', newHash)
  }

  header() {
    return `Delete metadata path '${this.args.path}' from object ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MetaDelete)
} else {
  module.exports = MetaDelete
}
