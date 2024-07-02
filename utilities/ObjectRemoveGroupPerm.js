// Remove a group permission for an object
const {ModOpt, NewOpt} = require('./lib/options')

const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/kits/Client')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const Logger = require('./lib/concerns/kits/Logger')

const permissionTypes = ['see', 'access', 'manage']

class ObjectRemoveGroupPerm extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ExistObj, Client],
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

    const {objectId, groupAddress, permission} = await this.concerns.ExistObj.argsProc()

    logger.log(`Removing permission: ${permission}...`)
    await client.RemoveContentObjectGroupPermission({
      objectId,
      groupAddress,
      permission
    })
  }

  header() {
    return `Remove '${this.args.permission}' permission for ${this.args.objectId} from group ${this.args.groupAddress}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(ObjectRemoveGroupPerm)
} else {
  module.exports = ObjectRemoveGroupPerm
}
