// Code relating to working with fabric objects.
// Named 'FabricObject' instead of 'Object' to prevent conflicts with built-in JS 'Object'

const uniq = require('@eluvio/elv-js-helpers/Functional/uniq')

const Client = require('../Client')
const Draft = require('./Draft')
const Finalize = require('../Finalize')
const Library = require('./Library')
const Logger = require('../Logger')
const Metadata = require('../Metadata')
const Part = require('../Part')
const Version = require('./Version')

const blueprint = {
  name: 'FabricObject',
  concerns: [Client, Draft, Finalize, Part, Library, Logger, Metadata, Version]
}

const New = context => {
  const logger = context.concerns.Logger

  const create = async ({libraryId, metadata, noWait, type, commitMessage = 'Create object'}) => {
    if(!libraryId) throw Error('FabricObject.create() - missing libraryId')
    const {objectId, writeToken} = await context.concerns.Draft.create({libraryId, metadata, type})
    const versionHash = await context.concerns.Finalize.finalize({
      libraryId,
      noWait,
      objectId,
      writeToken,
      commitMessage
    })
    return {objectId, versionHash}
  }

  // named 'del' instead of 'delete' because Javascript keyword
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

  const info = async ({libraryId, objectId}) => {
    if(!objectId) throw Error('FabricObject.info() - missing objectId')
    const client = await context.concerns.Client.get()
    return await client.ContentObject({
      libraryId,
      objectId
    })
  }

  const latestVersionHash = async ({libraryId, objectId}) => {
    if(!objectId) throw Error('FabricObject.latestVersionHash() - missing objectId')
    return (await info({
      libraryId,
      objectId
    })).hash
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

  const permission = async ({objectId}) => {
    if(!objectId) throw Error('FabricObject.permission() - missing objectId')
    const client = await context.concerns.Client.get()
    return await client.Permission({
      objectId,
      clearCache: true
    })
  }

  const size = async ({libraryId, objectId}) => {
    if(!objectId) throw Error('FabricObject.size() - missing objectId')
    logger.log('Calculating size of object...')
    const list = await partList({libraryId, objectId})
    const deduped = uniq(list)
    const regularVal = list.reduce((accumulator, element) => accumulator + element.size, 0)
    const dedupedVal = deduped.reduce((accumulator, element) => accumulator + element.size, 0)
    if(regularVal !== dedupedVal) logger.warn(`Part list has duplicates: sum=${regularVal}, deduped sum=${dedupedVal}`)
    return dedupedVal
  }

  const typeHash = async ({libraryId, objectId}) => {
    if(!objectId) throw Error('FabricObject.typeHash() - missing objectId')
    return (await info({
      libraryId,
      objectId
    })).type
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
    info,
    latestVersionHash,
    libraryId,
    metadata,
    partList,
    permission,
    size,
    typeHash,
    versionList
  }
}

module.exports = {
  blueprint,
  New
}
