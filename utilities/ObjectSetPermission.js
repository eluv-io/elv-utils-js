// Give a group permissions to an object
const {ModOpt, NewOpt} = require('./lib/options')

const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/kits/Client')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const Logger = require('./lib/concerns/kits/Logger')

const permissionTypes = ['owner', 'editable', 'viewable', 'listable', 'public']

class ObjectSetPermission extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ExistObj, Client],
      options: [
        ModOpt('objectId', {demand: true, X: ' to set permission on'}),
        NewOpt('permission', {
          choices: permissionTypes,
          demand: true,
          descTemplate: 'Permission level to set',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const logger = this.concerns.Logger
    const client = await this.concerns.Client.get()

    const {objectId, permission} = await this.concerns.ExistObj.argsProc()

    const prevHash = await client.LatestVersionHash({objectId: objectId})

    await client.SetPermission({
      objectId,
      permission
    })

    const newHash = await client.LatestVersionHash({objectId: objectId})

    if(prevHash === newHash) {
      logger.log('Version hash unchanged: ' + newHash )
    } else {
      logger.log('Previous version hash: ' + prevHash )
      logger.log('New version hash: ' + newHash )
    }
    logger.data('versionHash', newHash)
  }

  header() {
    return `Set permission on ${this.args.objectId} to ${this.args.permission}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(ObjectSetPermission)
} else {
  module.exports = ObjectSetPermission
}
