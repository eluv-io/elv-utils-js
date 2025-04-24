// List all nodes visible to the current private key
'use strict'

const Utility = require('./lib/Utility')

const ArgElvGeo = require('./lib/concerns/args/ArgElvGeo')
const ArgFabricVersion = require('./lib/concerns/args/ArgFabricVersion.js')
const ArgWriteToken = require('./lib/concerns/args/ArgWriteToken')
const FabricNode = require('./lib/concerns/libs/FabricNode')
const Logger = require('./lib/concerns/kits/Logger')

class ListLibraries extends Utility {
  static blueprint() {
    return {
      concerns: [ArgElvGeo, ArgFabricVersion, ArgWriteToken, FabricNode, Logger]
    }
  }

  async body() {
    const logger = this.logger
    const {elvGeo, fabricVersion, writeToken} = this.args
    const nodeList = await this.concerns.FabricNode.list({
      elvGeo,
      getFabricVersion: fabricVersion,
      writeToken
    })

    // const formattedNodeList = []
    this.logger.log(`Found ${(nodeList || []).length} node(s)`)

    logger.data('nodes', nodeList)
    if (this.args.json) {
      logger.log(JSON.stringify(nodeList, null, 2))
    } else {

      logger.log([
        'fabric_api',
        'id',
        'private',
        'fabric_version',
        'ethereum_api',
        'authority_service',
        'authority_service_stg',
        'file_service',
        'search',
        'search_v1',
        'search_v2'
      ].join(','))

      for (const n of nodeList) {
        logger.log([
          n.services?.fabric_api?.urls && n.services.fabric_api.urls.join('|'),
          n.id,
          n.private,
          n.fabric_version,
          n.services?.ethereum_api?.urls && n.services.ethereum_api.urls.join('|'),
          n.services?.authority_service?.urls && n.services.authority_service.urls.join('|'),
          n.services?.authority_service_stg?.urls && n.services.authority_service_stg.urls.join('|'),
          n.services?.file_service?.urls && n.services.file_service.urls.join('|'),
          n.services?.search?.urls && n.services.search.urls.join('|'),
          n.services?.search_v1?.urls && n.services.search_v1.urls.join('|'),
          n.services?.search_v2?.urls && n.services.search_v2.urls.join('|')
        ].join(','))

      }
    }


  }

  header() {
    return this.args.writeToken ?
      `Look up node for write token ${this.args.writeToken}` :
      `Get list of Content Fabric nodes${this.args.elvGeo ? ` for region ${this.args.elvGeo}` : ''}`
  }

}

if(require.main === module) {
  Utility.cmdLineInvoke(ListLibraries)
} else {
  module.exports = ListLibraries
}
