// List access groups visible to private key
const sortBy = require('@eluvio/elv-js-helpers/Functional/sortBy')

const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const Logger = require('./lib/concerns/Logger')

class ListAccessGroups extends Utility {
  blueprint() {
    return {
      concerns: [Logger, Client]
    }
  }

  async body() {
    const logger = this.concerns.Logger
    const client = await this.concerns.Client.get()

    const response = await client.ListAccessGroups()
    const nameSort = sortBy(x => x.name?.toLowerCase())
    const list = nameSort(response.map(g=> new Object({address: g.address, name: g.meta?.public?.name})))
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
