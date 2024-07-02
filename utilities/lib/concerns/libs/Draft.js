// for scripts that work with Drafts (new unfinalized objects/versions)
const fetch = require('node-fetch').default

const Utils = require('@eluvio/elv-client-js/src/Utils')

const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const Client = require('../kits/Client')
const Logger = require('../kits/Logger')
const FabricNode = require('./FabricNode')
const Finalize = require('./Finalize')

const blueprint = {
  name: 'Draft',
  concerns: [Client, Logger, Finalize, FabricNode]
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

  const finalize = async ({
    commitMessage,
    libraryId,
    noWait,
    objectId,
    writeToken
  }) => {
    if(!writeToken) throw Error('Draft.finalize() - missing writeToken')
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

  const metadata = async ({libraryId, objectId, subtree, writeToken}) => {
    if(!writeToken) throw Error('Draft.metadata() - missing writeToken')
    return await context.concerns.Metadata.get({
      libraryId,
      objectId,
      subtree,
      writeToken
    })
  }

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

  const objectId = ({writeToken}) => writeToken
    ? decode({writeToken}).objectId
    : throwError('Draft.objectId() - writeToken missing')

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
