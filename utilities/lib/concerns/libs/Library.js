// code related to libraries / library IDs
const mergeDeepRight = require('@eluvio/elv-js-helpers/Functional/mergeDeepRight')

const Client = require('../Client')
const Logger = require('../Logger')
const Part = require('../Part')

const blueprint = {
  name: 'Library',
  concerns: [Client, Logger, Part]
}

const stdDrmCert = require('../../data/elv.media.drm.fps.cert.json')

const New = context => {
  const logger = context.concerns.Logger

  const _ContentLibraryMemo = {}

  const _contentLibrary = async({libraryId}) => {
    if(!_ContentLibraryMemo[libraryId]) {
      const client = await context.concerns.Client.get()
      _ContentLibraryMemo[libraryId] = await client.ContentLibrary({libraryId})
    }
    return _ContentLibraryMemo[libraryId]
  }

  const create = async({description, kmsId, name, metadata}) => {
    if(!name) throw Error('Create library: name not supplied')
    const client = await context.concerns.Client.get()
    return await client.CreateContentLibrary({
      description,
      kmsId,
      name,
      metadata
    })
  }

  const forObject = async ({objectId, versionHash}) => {
    const client = await context.concerns.Client.get()
    let stringPart = ' for'
    if(objectId) stringPart += ` object ${objectId}`
    if(versionHash) stringPart += ` version ${versionHash}`
    logger.log(`Looking up library ID${stringPart}...`)
    const libId = await client.ContentObjectLibraryId({objectId, versionHash})
    logger.log(`Found library ID: ${libId}`)
    return libId
  }

  const info = async ({libraryId}) => {
    logger.log(`Getting info for library ${libraryId}...`)

    const libResponse = await _contentLibrary({libraryId})
    const contractMetadata = libResponse.meta
    const objectId = libResponse.qid

    const client = await context.concerns.Client.get()

    const objResponse = await client.ContentObject({libraryId, objectId})
    const latestHash = objResponse.hash
    const type = objResponse.type

    const metadata = await client.ContentObjectMetadata({libraryId, objectId})

    return {
      contractMetadata,
      latestHash,
      metadata,
      objectId,
      type
    }
  }

  // get object ID of the library itself
  const libObjectId = async({libraryId}) => (await _contentLibrary({libraryId})).qid

  // list of libraries
  const list = async () => {
    const logger = context.concerns.Logger
    logger.log('Getting list of libraries...')
    const client = await context.concerns.Client.get()
    return await client.ContentLibraries()
    // const libIds = await client.ContentLibraries();
    // if(libIds.length > 0) {
    //   logger.log("Getting library names...");
    // }

  }

  const metadata = async({libraryId}) => {
    const objectId = await libObjectId({libraryId})
    const client = await context.concerns.Client.get()
    return await client.ContentObjectMetadata({libraryId, objectId})
  }

  // list of objects within a library
  const objectList = async ({filterOptions, libraryId}) => {

    filterOptions = mergeDeepRight(
      {limit: 100000},
      filterOptions || {}
    )

    const logger = context.concerns.Logger
    logger.log('Getting list of objects...')
    const client = await context.concerns.Client.get()
    const reply = await client.ContentObjects({
      libraryId,
      filterOptions
    })
    return reply.contents.map(x => ({objectId: x.id, latestHash: x.versions[0].hash, metadata: x.versions[0].meta}))
  }

  const partList = async ({libraryId, objectId}) => await context.concerns.Part.list({libraryId, objectId})

  const typeHash = async ({libraryId}) => {
    if(!libraryId) throw Error('Library.typeHash() - missing libraryId')
    return (await info({libraryId})).type
  }

  return {
    create,
    forObject,
    info,
    libObjectId,
    list,
    metadata,
    objectList,
    partList,
    typeHash
  }
}

module.exports = {
  blueprint,
  New,
  stdDrmCert
}
