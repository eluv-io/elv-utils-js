// code related to working with nodes

const AuthToken = require('../libs/AuthToken')
const Client = require('../kits/Client')
const Logger = require('../kits/Logger')
const CBOR = require('cbor')

const blueprint = {
  name: 'FabricNode',
  concerns: [Logger, Client, AuthToken]
}

const New = context => {

  const activeCount = async () => {
    const client = await context.concerns.Client.get()
    return await client.CallContractMethod({
      contractAddress: client.contentSpaceAddress,
      methodName: 'numActiveNodes'
    })
  }

  const activeEthAddrByIndex = async (index) => {
    const client = await context.concerns.Client.get()
    return await client.CallContractMethod({
      contractAddress: client.contentSpaceAddress,
      methodName: 'activeNodeAddresses',
      methodArgs: [index]
    })
  }

  const activeInfoByIndex = async (index) => {
    const client = await context.concerns.Client.get()
    const nodeInfoCBOR = await client.CallContractMethod({
      contractAddress: client.contentSpaceAddress,
      methodName: 'activeNodeLocators',
      methodArgs: [index]
    })
    return CBOR.decodeFirstSync(nodeInfoCBOR.slice(16, nodeInfoCBOR.length))
  }

  const list = async ({elvgeo, writeToken}) => {
    const client = await context.concerns.Client.get()
    const authToken = await context.concerns.AuthToken.getPlain()
    const response = await client.utils.ResponseToJson(
      client.HttpClient.Request({
        path: 'nodes',
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        queryParams: {
          elvgeo,
          token: writeToken
        }
      })
    )
    return response.nodes
  }

  // instance interface
  return {
    activeCount,
    activeEthAddrByIndex,
    activeInfoByIndex,
    list
  }
}

module.exports = {
  blueprint,
  New
}
