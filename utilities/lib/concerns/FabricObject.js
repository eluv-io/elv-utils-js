// Code relating to reading (latest version of) pre-existing fabric objects
// Named 'FabricObject' instead of 'Object' to prevent conflicts with built-in JS 'Object'
const R = require('@eluvio/ramda-fork')

const Client = require('./Client')
const Draft = require('./Draft')
const Finalize = require('./Finalize')
const Library = require('./Library')
const Logger = require('./Logger')
const Metadata = require('./Metadata')
const Part = require('./Part')
const Version = require('./Version')

const blueprint = {
  name: 'FabricObject',
  concerns: [Client, Draft, Finalize, Part, Library, Logger, Metadata, Version]
}

const New = context => {
  const logger = context.concerns.Logger

  const create = async ({commitMessage, libraryId, metadata, noWait, type}) => {
    if(!libraryId) throw Error('FabricObject.create() - missing libraryId')
    const {objectId, writeToken} = await context.concerns.Draft.create({libraryId, metadata, type})
    const versionHash = await context.concerns.Finalize.finalize({commitMessage, libraryId, noWait, objectId, writeToken})
    return {objectId, versionHash}
  }

  const del = async ({libraryId, objectId}) => {
    if(!objectId) throw Error('FabricObject.del() - missing objectId')
    const client = await context.concerns.Client.get()
    await client.DeleteContentObject({
      libraryId,
      objectId
    })
  }

  const groupPerms = async ({objectId}) => {
    if(!objectId) throw Error('FabricObject.groupPerms() - missing objectId')
    const client = await context.concerns.Client.get()
    return await client.ContentObjectGroupPermissions({objectId})
  }

  const latestVersionHash = async ({libraryId, objectId}) => {
    if(!objectId) throw Error('FabricObject.latestVersionHash() - missing objectId')
    const client = await context.concerns.Client.get()
    const response = await client.ContentObject({
      libraryId,
      objectId
    })
    return response.hash
  }

  const libraryId = async ({objectId}) => {
    if(!objectId) throw Error('FabricObject.libraryId() - missing objectId')
    return await context.concerns.Library.forObject({objectId})
  }

  const metadata = async ({libraryId, objectId, subtree}) => {
    if(!objectId) throw Error('FabricObject.metadata() - missing objectId')
    return await context.concerns.Metadata.get({
      libraryId,
      objectId,
      subtree
    })
  }

  const partList = async ({libraryId, objectId}) => {
    if(!objectId) throw Error('FabricObject.partList() - missing objectId')
    return await context.concerns.Part.list({libraryId, objectId})
  }

  const size = async ({libraryId, objectId}) => {
    if(!objectId) throw Error('FabricObject.size() - missing objectId')
    logger.log('Calculating size of object...')
    const list = await partList({libraryId, objectId})
    const deduped = R.uniq(list)
    const regularVal = list.reduce((accumulator, element) => accumulator + element.size, 0)
    const dedupedVal = deduped.reduce((accumulator, element) => accumulator + element.size, 0)
    if(regularVal !== dedupedVal) logger.warn(`Part list has duplicates: sum=${regularVal}, deduped sum=${dedupedVal}`)
    return dedupedVal
  }

  const versionList = async ({libraryId, objectId}) => {
    if(!objectId) throw Error('FabricObject.versionList() - missing objectId')
    return await context.concerns.Version.list({libraryId, objectId})
  }

  // instance interface
  return {
    create,
    del,
    groupPerms,
    latestVersionHash,
    libraryId,
    metadata,
    partList,
    size,
    versionList
  }
}

module.exports = {
  blueprint,
  New
}
