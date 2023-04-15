// Start a draft on an existing object

const Utility = require('./lib/Utility')

const Draft = require('./lib/concerns/libs/Draft')
const ExistObj = require('./lib/concerns/kits/ExistObj')

class ObjectCreateDraft extends Utility {
  static blueprint() {
    return {
      concerns: [ExistObj, Draft]
    }
  }

  async body() {
    const logger = this.logger

    // operations that may need to wait on network access
    // ----------------------------------------------------
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    logger.log('Obtaining write token...')

    const result = await this.concerns.Draft.create({libraryId, objectId})
    logger.data('nodeUrl', result.nodeUrl)
    logger.data('writeToken', result.writeToken)

    logger.log()
    logger.log(`Write token: ${result.writeToken}`)
    logger.log(`Node URL: ${result.nodeUrl}`)
  }

  header() {
    return `Create a draft on existing object ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(ObjectCreateDraft)
} else {
  module.exports = ObjectCreateDraft
}
