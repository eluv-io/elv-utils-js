// Get permission setting of an object
const {ModOpt} = require('./lib/options')

const Utility = require('./lib/Utility')

const ExistObj = require('./lib/concerns/kits/ExistObj')
const Logger = require('./lib/concerns/kits/Logger')

class ObjectGetPermission extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ExistObj],
      options: [
        ModOpt('objectId', {demand: true, X: ' to get permission setting for'})
      ]
    }
  }

  async body() {
    const logger = this.concerns.Logger

    const permission = await this.concerns.ExistObj.permission()

    logger.data('permission', permission)
    logger.log(`Permission: ${permission}`)
  }

  header() {
    return `Get object permission setting for ${this.args.objectId}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(ObjectGetPermission)
} else {
  module.exports = ObjectGetPermission
}
