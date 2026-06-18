// List info about a specific node
'use strict'

const Utility = require('./lib/Utility')
const {ModOpt} = require('./lib/options')

const ArgNodeId = require('./lib/concerns/args/ArgNodeId')
const ArgWriteToken = require('./lib/concerns/args/ArgWriteToken')
const FabricNode = require('./lib/concerns/libs/FabricNode')
const Logger = require('./lib/concerns/kits/Logger')

class ListLibraries extends Utility {
  static blueprint() {
    return {
      concerns: [ArgNodeId, ArgWriteToken, FabricNode, Logger],
      options: [
        ModOpt('nodeId', {
          conflicts: 'writeToken'
        })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {nodeId, writeToken} = this.args

    const nodeList = await this.concerns.FabricNode.list({
      getFabricVersion: true,
      nodeId,
      writeToken
    })

    if (!nodeList) {
      throw Error('node not found')
    }

    logger.data('node', nodeList[0])
    logger.log(JSON.stringify(nodeList[0], null, 2))
  }

  header() {
    return `Look up node info ${this.args.writeToken ? `for write token ${this.args.writeToken}` : (this.args.nodeId ? `for node Id ${this.args.nodeId}` : '')}`
  }

}

if (require.main === module) {
  Utility.cmdLineInvoke(ListLibraries)
} else {
  module.exports = ListLibraries
}
