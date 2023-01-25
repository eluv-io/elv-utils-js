// Give a group permission to an object
const {ModOpt, NewOpt} = require('./lib/options')

const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const ArgObjectId = require('./lib/concerns/ArgObjectId')
const Logger = require('./lib/concerns/Logger')

const permissionTypes = ['see', 'access', 'manage']

class AddGroupPerm extends Utility {
  blueprint() {
    return {
      concerns: [Logger, ArgObjectId, Client],
      options: [
        ModOpt('objectId', {demand: true, X: ' to add group permission to'}),
        NewOpt('groupAddress', {
          demand: true,
          descTemplate: 'address of group to grant permission to',
          type: 'string'
        }),
        NewOpt('permission', {
          choices: permissionTypes,
          demand: true,
          descTemplate: 'The permission to add',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const logger = this.concerns.Logger
    const client = await this.concerns.Client.get()

    const {objectId, groupAddress, permission} = await this.concerns.ArgObjectId.argsProc()

    logger.log(`Adding permission: ${permission}...`)
    await client.AddContentObjectGroupPermission({
      objectId,
      groupAddress,
      permission
    })
  }

  header() {
    return `Add '${this.args.permission}' permission to ${this.args.objectId} for group ${this.args.groupAddress}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(AddGroupPerm)
} else {
  module.exports = AddGroupPerm
}
