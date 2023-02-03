// Remove a group permission for an object
const {ModOpt, NewOpt} = require('./lib/options')

const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const ArgObjectId = require('./lib/concerns/ArgObjectId')
const Logger = require('./lib/concerns/Logger')

const permissionTypes = ['see', 'access', 'manage']

class ObjectRemoveGroupPerm extends Utility {
  blueprint() {
    return {
      concerns: [Logger, ArgObjectId, Client],
      options: [
        ModOpt('objectId', {demand: true, X: ' to remove group permission from'}),
        NewOpt('groupAddress', {
          demand: true,
          descTemplate: 'address of group to remove permission from',
          type: 'string'
        }),
        NewOpt('permission', {
          choices: permissionTypes,
          demand: true,
          descTemplate: 'The permission to remove',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const logger = this.concerns.Logger
    const client = await this.concerns.Client.get()

    const {objectId, groupAddress, permission} = await this.concerns.ArgObjectId.argsProc()

    logger.log(`Removing permission: ${permission}...`)
    await client.RemoveContentObjectGroupPermission({
      objectId,
      groupAddress,
      permission
    })
  }

  header() {
    return `Remove '${this.args.permission}' permission to ${this.args.objectId} for group ${this.args.groupAddress}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(ObjectRemoveGroupPerm)
} else {
  module.exports = ObjectRemoveGroupPerm
}
