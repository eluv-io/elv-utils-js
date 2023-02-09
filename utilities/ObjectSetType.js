// Set content type for an object
const {NewOpt} = require('./lib/options')

const Utility = require('./lib/Utility')

const ContentType = require('./lib/concerns/ContentType')
const ExistObj = require('./lib/concerns/ExistObj')
const Logger = require('./lib/concerns/Logger')

class ObjectSetType extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ExistObj, ContentType],
      options: [
        NewOpt('type', {
          descTemplate: 'Content type ID, version hash, or name',
          demand: true,
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const logger = this.concerns.Logger
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()
    const typeRef = this.args.type

    let newHash = (await this.concerns.ContentType.set({libraryId, objectId, typeRef})).hash
    logger.data('version_hash', newHash)
    logger.log(`New version hash: ${newHash}`)
  }

  header() {
    return `Set content type on ${this.args.objectId} to '${this.args.type}'`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(ObjectSetType)
} else {
  module.exports = ObjectSetType
}
