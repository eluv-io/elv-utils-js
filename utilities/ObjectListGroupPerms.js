// List group permissions on an object
const {ModOpt} = require('./lib/options')

const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const ArgObjectId = require('./lib/concerns/ArgObjectId')
const Logger = require('./lib/concerns/Logger')

class ObjectListGroupPerms extends Utility {
  blueprint() {
    return {
      concerns: [Logger, ArgObjectId, Client],
      options: [
        ModOpt('objectId', {demand: true, X: ' to list group permissions for'})
      ]
    }
  }

  async body() {
    const logger = this.concerns.Logger
    const client = await this.concerns.Client.get()

    const {objectId} = await this.concerns.ArgObjectId.argsProc()

    logger.logObject(
      await client.ContentObjectGroupPermissions({objectId})
    )
  }

  header() {
    return `List group permissions for object ${this.args.objectId}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(ObjectListGroupPerms)
} else {
  module.exports = ObjectListGroupPerms
}
