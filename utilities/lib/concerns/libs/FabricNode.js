// code related to working with nodes
'use strict'

const AuthToken = require('../libs/AuthToken')
const Client = require('../Client')
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

  const list = async ({elvgeo, getFabricVersion, writeToken}) => {
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
    let result = response.nodes
    if (getFabricVersion) {
      for (const n of result) {
        const urls = n.services?.fabric_api?.urls
        if (urls) {
          n.fabric_version = await version(urls[0])
        } else {
          n.fabric_version = 'UNKNOWN: No fabric_api URLs'
        }
      }
    }
    return response.nodes
  }

  const version = async (nodeURL) => {
    const client = await context.concerns.Client.get()
    const url = nodeURL + `/config?qspace=${client.contentSpaceId}`
    try {
      const response = await client.utils.ResponseToJson(
        client.HttpClient.constructor.Fetch(
          url,
          {method: 'GET'})
      )
      return response.fabric_version
    } catch (e) {
      return `UNKNOWN: ${e.message}`
    }
  }

  // instance interface
  return {
    activeCount,
    activeEthAddrByIndex,
    activeInfoByIndex,
    list,
    version
  }
}

module.exports = {
  blueprint,
  New
}
