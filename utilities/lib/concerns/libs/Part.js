// code related to working with a specific content part
const isString = require('@eluvio/elv-js-helpers/Boolean/isString')

const {fabricItemDesc} = require('../../helpers')

const Client = require('../kits/Client')
const Logger = require('../kits/Logger')
const Edit = require('./Edit')

const blueprint = {
  name: 'Part',
  concerns: [Logger, Client, Edit]
}

const New = context => {
  const logger = context.concerns.Logger

  const list = async ({libraryId, objectId, versionHash, writeToken}) => {
    if(!objectId && !versionHash && !writeToken) throw Error('Part.list() - need objectId, versionHash, or writeToken')

    const client = await context.concerns.Client.get()
    logger.log(`Retrieving part list for ${fabricItemDesc({objectId, versionHash, writeToken})}...`)
    return await client.ContentParts({
      libraryId,
      objectId,
      versionHash,
      writeToken
    })
  }

  const upload = async ({libraryId, objectId, writeToken, storeClear, partData, commitMessage}) => {
    if(!objectId && !writeToken) throw Error('Part.upload() - need objectId or writeToken')
    const writeTokenSupplied = isString(writeToken)
    const client = await context.concerns.Client.get()
    // if write token passed in, use it, otherwise get one
    if (!writeTokenSupplied) writeToken = (await context.concerns.Edit.getWriteToken({
      libraryId,
      objectId
    })).writeToken

    const uploadPartResponse = await client.UploadPart({
      libraryId,
      objectId,
      writeToken,
      data: partData,
      encryption: storeClear ?  'none': 'cgck'
    })
    const partHash = uploadPartResponse.part.hash
    let versionHash

    if(!writeTokenSupplied) {
      // return latest version hash
      versionHash = await context.concerns.Edit.finalize({
        commitMessage,
        libraryId,
        objectId,
        writeToken
      })
    }

    return {partHash, versionHash}
  }

  // instance interface
  return {
    list,
    upload
  }
}

module.exports = {
  blueprint,
  New
}
