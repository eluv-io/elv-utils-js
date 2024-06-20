// List access groups visible to private key
const Utility = require('./lib/Utility')

const AccessGroup = require('./lib/concerns/AccessGroup')
const Logger = require('./lib/concerns/Logger')

class ListAccessGroups extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, AccessGroup]
    }
  }

  async body() {
    const logger = this.concerns.Logger
    const list = await this.concerns.AccessGroup.list()
    logger.data('accessGroups', list)
    logger.logTable({list})
  }

  header() {
    return 'List access groups visible to the currently configured private key'
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(ListAccessGroups)
} else {
  module.exports = ListAccessGroups
}
