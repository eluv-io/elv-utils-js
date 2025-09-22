'use strict'
// for scripts that work with Drafts (new unfinalized objects/versions)
const fetch = require('node-fetch').default

const Utils = require('@eluvio/elv-client-js/src/Utils')

const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const Client = require('../Client')
const FabricNode = require('../libs/FabricNode')
const Logger = require('../kits/Logger.js')
const Finalize = require('./Finalize.js')

const blueprint = {
  name: 'Draft',
  concerns: [Client, FabricNode, Logger, Finalize]
}

const New = context => {
  const logger = context.concerns.Logger

  // TODO: deprecate, replace usages with calls to createForExistingObject / createForNewObject instead
  const create = async ({libraryId, objectId, metadata, type}) => {
    if(!libraryId && !objectId) throw Error('Draft.create() - no libraryId or objectId supplied')
    const client = await context.concerns.Client.get()
    const options = {
      meta: metadata,
      type
    }

    let response
    if(objectId) {
      // create new draft version for an existing object
      logger.log(`Creating new draft version for object ${objectId}...`)
      response = await client.EditContentObject({
        libraryId,
        objectId,
        options
      })
    } else {
      // create new object
      logger.log(`Creating new draft object in library ${libraryId}...`)
      response = await client.CreateContentObject({
        libraryId,
        options
      })
      logger.log(`New object ID: ${response.objectId}`)
    }

    logger.log(`New write token: ${response.writeToken}`)
    return {
      objectId: response.objectId,
      writeToken: response.writeToken,
      nodeUrl: response.nodeUrl
    }
  }

  // creates a new draft for existing object
  const createForExistingObject = async ({libraryId, objectId}) => {
    const client = await context.concerns.Client.get()
    // create new draft version for an existing object
    logger.log(`Creating new draft version for object ${objectId}...`)
    const response = await client.EditContentObject({
      libraryId,
      objectId
    })
    logger.log(`New write token: ${response.writeToken}`)
    return {
      objectId: response.objectId,
      writeToken: response.writeToken,
      nodeUrl: response.nodeUrl
    }
  }

  // creates a new object and leaves unfinalized
  const createForNewObject = async ({libraryId, metadata, type}) => {
    const client = await context.concerns.Client.get()
    logger.log(`Creating new draft object in library ${libraryId}...`)
    const response = await client.CreateContentObject({
      libraryId,
      options: {
        meta: metadata,
        type
      }
    })
    logger.log(`New object ID: ${response.objectId}`)
    logger.log(`New write token: ${response.writeToken}`)
    return {
      objectId: response.objectId,
      writeToken: response.writeToken,
      nodeUrl: response.nodeUrl
    }
  }

  const decode = ({writeToken}) => {
    if(!writeToken) throw Error('Draft.decode() - missing writeToken')
    return Utils.DecodeWriteToken(writeToken)
  }

  const finalize = async ({commitMessage, libraryId, objectId, writeToken, noWait}) => {
    if(!writeToken) throw Error('Draft.info() - missing writeToken')
    return await context.concerns.Finalize.finalize({
      commitMessage,
      libraryId,
      objectId,
      writeToken,
      noWait
    })
  }

  const info = async ({libraryId, objectId, writeToken}) => {
    if(!writeToken) throw Error('Draft.info() - missing writeToken')
    const client = await context.concerns.Client.get()
    return await client.ContentObject({
      libraryId,
      objectId,
      writeToken
    })
  }

  const metadata = async ({libraryId, objectId, ignoreResolveErrors, resolveLinks, subtree, writeToken}) => {
    if(!writeToken) throw Error('Draft.metadata() - missing writeToken')
    return await context.concerns.Metadata.get({
      ignoreResolveErrors,
      libraryId,
      objectId,
      resolveLinks,
      subtree,
      writeToken
    })
  }

  // const nodeInfo = async ({writeToken}) => {
  //   if(!writeToken) throw Error('Draft.node() - missing writeToken')
  //   logger.log(`Getting node info for write token ${writeToken}...`)
  //   const {nodeId} = decode({writeToken})
  //   const nodeAddress = Utils.HashToAddress(nodeId)
  //   const client = await context.concerns.Client.get()
  //
  //   const numActiveNodes = await client.CallContractMethod({
  //     contractAddress: client.contentSpaceAddress,
  //     methodName: 'numActiveNodes'
  //   })
  //
  //   for(let i = 0; i < numActiveNodes; i++){
  //     const activeNodeAddress = await client.CallContractMethod({
  //       contractAddress: client.contentSpaceAddress,
  //       methodName: 'activeNodeAddresses',
  //       methodArgs: [i]
  //     })
  //     if(Utils.FormatAddress(activeNodeAddress) === Utils.FormatAddress(nodeAddress)){
  //       const nodeInfoCBOR = await client.CallContractMethod({
  //         contractAddress: client.contentSpaceAddress,
  //         methodName: 'activeNodeLocators',
  //         methodArgs: [i]
  //       })
  //       return CBOR.decodeFirstSync(nodeInfoCBOR.slice(16, nodeInfoCBOR.length))
  //     }
  //   }
  //   throw Error(`No match found for node: ${nodeId} (possibly wrong network - double-check your fabric config url)`)
  // }

  const nodeURL = async ({writeToken}) => {
    if(!writeToken) throw Error('Draft.nodeURL() - missing writeToken')
    const list = await context.concerns.FabricNode.list({writeToken})
    if (list.length !== 1) throwError(`Unexpected number of nodes found (${list.length})`)
    const nodeUrl = list[0].services.fabric_api.urls[0]
    await recordWriteTokenNodeURL({writeToken, nodeUrl})
    return nodeUrl
  }

  // const nodeURL = async ({writeToken}) => {
  //   const info = await nodeInfo({writeToken})
  //   const fabricInfo = info.fab[0]
  //   const url = new URL('https://dummy')
  //   url.protocol = fabricInfo.scheme
  //   url.hostname = fabricInfo.host
  //   if(fabricInfo.port !== '') {
  //     url.port = parseInt(fabricInfo.port)
  //   }
  //   const nodeUrl = url.href
  //   await recordWriteTokenNodeURL({writeToken, nodeUrl})
  //   return nodeUrl
  // }

  const nodeURLValidate = async ({nodeUrl, writeToken}) => {
    if(!nodeUrl) throw Error('Draft.nodeURLValidate() - nodeUrl missing')
    if(!writeToken) throw Error('Draft.nodeURLValidate() - writeToken missing')

    const tokenInfo = decode({writeToken})
    const client = await context.concerns.Client.get()

    const nodeConfigUrl = context.concerns.Client.altConfigUrl(nodeUrl)

    const response = await fetch(nodeConfigUrl)
    if(!response.ok) throw Error(`Check that nodeUrl '${nodeUrl}' is for network '${client.networkName}'. Node config response: '${response.statusText}'`)
    const body = await response.json()

    if(tokenInfo.nodeId !== body.node_id){
      throw Error(`--nodeUrl incorrect for --writeToken (nodeUrl node ID:${tokenInfo.nodeId}, writeToken node ID:${body.node_id})`)
    }
  }

  const objectId = ({writeToken}) => {
    if (!writeToken) throwError('Draft.objectId() - writeToken not supplied')
    const decoded = decode({writeToken})
    if (!decoded.objectId) throwError(`Draft.objectId() - decoded write token does not contain an object ID: \n${JSON.stringify(decoded, null, 2)}\n`)
    return decoded.objectId
  }

  const partList = async ({libraryId, objectId, writeToken}) => {
    if(!writeToken) throw Error('Draft.partList() - missing writeToken')
    return await context.concerns.Part.list({libraryId, objectId, writeToken})
  }

  const recordWriteTokenNodeURL = async ({writeToken, nodeUrl}) => {
    await nodeURLValidate({writeToken, nodeUrl})
    // save url to HttpClient.draftURIs so request URLs containing this writeToken get routed to proper node
    const client = await context.concerns.Client.get()
    client.HttpClient.RecordWriteToken(writeToken, nodeUrl)
  }

  const typeHash = async ({libraryId, objectId, writeToken}) => {
    if(!writeToken) throw Error('Draft.typeHash() - missing writeToken')
    return (await info({
      libraryId,
      objectId,
      writeToken
    })).type
  }

  // instance interface
  return {
    create,
    createForExistingObject,
    createForNewObject,
    decode,
    finalize,
    info,
    metadata,
    // nodeInfo,
    nodeURL,
    nodeURLValidate,
    objectId,
    partList,
    recordWriteTokenNodeURL,
    typeHash
  }
}

module.exports = {
  blueprint,
  New
}
