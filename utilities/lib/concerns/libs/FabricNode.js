// for scripts that work with Nodes
// const CBOR = require('cbor')
const fetch = require('node-fetch').default

const Utils = require('@eluvio/elv-client-js/src/Utils')

// const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const Client = require('../Client')
const Logger = require('../Logger')
const CBOR = require('cbor')

const blueprint = {
  name: 'FabricNode',
  concerns: [Client, Logger]
}

const New = context => {
  const logger = context.concerns.Logger

  const config = async ({nodeAddress, nodePort, nodeScheme}) => {
    if (!nodeAddress) throw Error('FabricNode.info() - missing nodeAddress')
    const url = await configURL({nodeAddress, nodePort, nodeScheme})
    logger.log(`Getting config for ${url}...`)
    const response = await fetch(url)
    if(!response.ok) throw Error(`ERROR - node config response: '${response.statusText}'`)
    return await response.json()
  }

  // returns a fabric config URL specifying a single node (on same network as ElvClient)
  const configURL = async ({nodeAddress, nodePort, nodeScheme = 'https'}) => {
    const client = await context.concerns.Client.get()
    let url = new URL(nodeScheme + '://' + nodeAddress + (nodePort ? ':' + nodePort : ''))
    url.pathname = '/config'
    url.search = `?self&qspace=${client.networkName}`
    return url.href
  }

  const count = async () => {
    const client = await context.concerns.Client.get()

    return await client.CallContractMethod({
      contractAddress: client.contentSpaceAddress,
      methodName: 'numActiveNodes'
    })
  }

  // returns array of node information for all nodes on current
  // network
  const list = async ({includeConfig}) => {
    const numActiveNodes = await count()
    const client = await context.concerns.Client.get()
    let result = []
    for (let i = 0; i < numActiveNodes; i++) {
      const nodeEthAddress = await client.CallContractMethod({
        contractAddress: client.contentSpaceAddress,
        methodName: 'activeNodeAddresses',
        methodArgs: [i]
      })

      const formattedEthAddress = Utils.FormatAddress(nodeEthAddress)
      const nodeId = Utils.AddressToHash(nodeEthAddress)

      const nodeInfoCBOR = await client.CallContractMethod({
        contractAddress: client.contentSpaceAddress,
        methodName: 'activeNodeLocators',
        methodArgs: [i]
      })

      const nodeInfo = CBOR.decodeFirstSync(nodeInfoCBOR.slice(16, nodeInfoCBOR.length))
      nodeInfo.contractAddress = formattedEthAddress
      nodeInfo.nodeIndex = i
      nodeInfo.nodeId = nodeId

      if (includeConfig) {
        for (const nodeFabElement of nodeInfo.fab) {
          try {
            nodeFabElement.config = await config({
              nodeAddress: nodeFabElement.host,
              nodePort: nodeFabElement.port,
              nodeScheme: nodeFabElement.scheme
            })
          } catch (e) {
            console.log(e)
            console.log(e.message)
            nodeFabElement.config = {error: e.message}
          }
        }
      }
      result.push(nodeInfo)
    }
    return result
  }

  // instance interface
  return {
    config,
    configURL,
    count,
    list
  }
}

module.exports = {
  blueprint,
  New
}
