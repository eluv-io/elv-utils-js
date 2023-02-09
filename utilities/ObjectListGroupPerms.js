// List group permissions on an object
const {ModOpt} = require('./lib/options')

const Utility = require('./lib/Utility')

const AccessGroup = require('./lib/concerns/AccessGroup')
const ArgObjectId = require('./lib/concerns/ArgObjectId')
const FabricObject = require('./lib/concerns/FabricObject')
const Logger = require('./lib/concerns/Logger')

class ObjectListGroupPerms extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ArgObjectId, AccessGroup, FabricObject],
      options: [
        ModOpt('objectId', {demand: true, X: ' to list group permissions for'})
      ]
    }
  }

  async body() {
    const logger = this.concerns.Logger
    // get group list so we can look up names
    const groups = await this.concerns.AccessGroup.index()

    const {objectId} = await this.concerns.ArgObjectId.argsProc()

    const groupsAndPerms = await this.concerns.FabricObject.groupPerms({objectId})

    const list = Object.entries(groupsAndPerms).map(
      kvPair => Object({
        address: kvPair[0],
        name: groups[kvPair[0]]?.name || '',
        see: kvPair[1].includes('see') ? 'x' : '',
        access: kvPair[1].includes('access') ? 'x' : '',
        manage: kvPair[1].includes('manage') ? 'x' : ''
      })
    )

    if (list.length === 0) {
      logger.log()
      logger.log('No group permissions found.')
    } else {
      logger.logTable({
        list,
        options: {
          config: {
            see: {align: 'center'},
            access: {align: 'center'},
            manage: {align: 'center'}
          }
        }
      })
    }
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
