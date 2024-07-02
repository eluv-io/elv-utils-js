// code related to editing fabric objects
const kindOf = require('kind-of')

const Client = require('../kits/Client')
const Finalize = require('./Finalize')
const Logger = require('../kits/Logger')

const blueprint = {
  name: 'Edit',
  concerns: [Finalize, Logger, Client]
}

const New = context => {
  const logger = context.concerns.Logger

  const deleteMetadata =  async ({commitMessage,libraryId, metadataSubtree, noWait, objectId, writeToken}) => {
    const writeTokenSupplied = kindOf(writeToken) === 'string'
    if(!writeTokenSupplied ) writeToken = (await getWriteToken({libraryId, objectId})).writeToken

    logger.log('Deleting metadata from object...')
    const client = await context.concerns.Client.get()
    await client.DeleteMetadata({
      libraryId,
      metadataSubtree,
      objectId,
      writeToken
    })

    if(!writeTokenSupplied) {
      // return latest version hash
      return await finalize({
        commitMessage,
        libraryId,
        noWait,
        objectId,
        writeToken
      })
    }
  }

  const finalize = async ({commitMessage,libraryId, noWait, objectId, writeToken}) => {
    return await context.concerns.Finalize.finalize({
      commitMessage,
      libraryId,
      noWait,
      objectId,
      writeToken
    })
  }

  const getWriteToken = async ({libraryId, objectId} = {}) => {
    logger.log('Getting write token...')
    const client = await context.concerns.Client.get()
    const editResponse = await client.EditContentObject({
      libraryId,
      objectId
    })
    logger.log(`New write token: ${editResponse.write_token}`)
    logger.log(`       node URL: ${editResponse.nodeUrl}`)
    return {writeToken: editResponse.write_token, nodeUrl: editResponse.nodeUrl}
  }

  // TODO: remove auto-magic commit behavior and refactor into a separate wrapper
  // if writeToken passed in, don't finalize
  // if writeToken not passed in, get one and finalize after
  const writeMetadata =  async ({commitMessage,libraryId, metadata, metadataSubtree, noWait, objectId, writeToken}) => {
    const writeTokenSupplied = kindOf(writeToken) === 'string'
    if(!writeTokenSupplied ) writeToken = (await getWriteToken({libraryId, objectId})).writeToken

    logger.log('Writing metadata to object...')
    const client = await context.concerns.Client.get()
    await client.ReplaceMetadata({
      libraryId,
      metadata,
      metadataSubtree,
      objectId,
      writeToken
    })

    if(!writeTokenSupplied) {
      // return latest version hash
      return await finalize({
        commitMessage,
        libraryId,
        noWait,
        objectId,
        writeToken
      })
    }

  }

  return {
    deleteMetadata,
    finalize,
    getWriteToken,
    writeMetadata
  }
}

module.exports = {
  blueprint,
  New
}
