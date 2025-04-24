// Code relating to working with a specific fabric object version
const pick = require('@eluvio/elv-js-helpers/Functional/pick')

const Utils = require('@eluvio/elv-client-js/src/Utils')

const Client = require('../Client')
const Logger = require('../kits/Logger.js')
const Metadata = require('../Metadata')
const Part = require('../Part')

const blueprint = {
  name: 'Version',
  concerns: [Client, Logger, Metadata, Part]
}

const decode = ({versionHash}) => {
  if(!versionHash) throw Error('Version.decode() - missing versionHash')
  return Utils.DecodeVersionHash(versionHash)
}

const New = context => {

  const logger = context.concerns.Logger

  const del = async ({versionHash}) => {
    if(!versionHash) throw Error('Version.del() - missing versionHash')
    logger.log(`Deleting object version ${versionHash}...`)
    const client = await context.concerns.Client.get()
    await client.DeleteContentVersion({versionHash})
  }

  const info = async ({libraryId, objectId, versionHash}) => {
    if(!versionHash) throw Error('Version.info() - missing versionHash')
    const client = await context.concerns.Client.get()
    return await client.ContentObject({
      libraryId,
      objectId,
      versionHash
    })
  }

  const list = async ({libraryId, objectId}) => {
    if(!objectId) throw Error('Version.list() - missing objectId')
    const client = await context.concerns.Client.get()
    logger.log(`Retrieving version list for object ${objectId}...`)
    const response = await client.ContentObjectVersions({
      libraryId,
      objectId
    })
    return response.versions.map(pick(['hash', 'type']))
  }

  const metadata = async ({libraryId, objectId, subtree, versionHash}) => {
    if(!versionHash) throw Error('Version.metadata() - missing versionHash')
    return await context.concerns.Metadata.get({
      libraryId,
      objectId,
      subtree,
      versionHash
    })
  }

  const objectId = ({versionHash}) => {
    if(!versionHash) throw Error('Version.objectId() - missing versionHash')
    logger.log(`Decoding object id from hash ${versionHash}...`)
    const decodeResult = decode({versionHash})
    logger.log(`Found: ${decodeResult.objectId}`)
    return decodeResult.objectId
  }

  const partList = async ({libraryId, objectId, versionHash}) => {
    if(!versionHash) throw Error('Version.partList() - missing versionHash')
    return await context.concerns.Part.list({libraryId, objectId, versionHash})
  }

  const typeHash = async ({libraryId, objectId, versionHash}) => {
    if(!versionHash) throw Error('Version.typeHash() - missing versionHash')
    return (await info({
      libraryId,
      objectId,
      versionHash
    })).type
  }

  return {
    decode,
    del,
    info,
    list,
    metadata,
    objectId,
    partList,
    typeHash
  }
}

module.exports = {
  blueprint,
  decode,
  New
}
