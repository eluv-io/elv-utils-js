// Code for working with files within content fabric objects

const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')
const getPath = require('@eluvio/elv-js-helpers/Functional/getPath')
const isNumber = require('@eluvio/elv-js-helpers/Boolean/isNumber')
const sortBy = require('@eluvio/elv-js-helpers/Functional/sortBy')
const throwIfArgsBad = require('@eluvio/elv-js-helpers/Validation/throwIfArgsBad')

const FabricFilePathModel = require('../models/FabricFilePathModel')
const LibraryIdModel = require('../models/LibraryIdModel')
const ObjectIdModel = require('../models/ObjectIdModel')
const VersionHashModel = require('../models/VersionHashModel')

const Client = require('./Client')
const Logger = require('./Logger')
const Metadata = require('./Metadata')

const blueprint = {
  name: 'FabricFile',
  concerns: [Client, Logger, Metadata]
}

const fileEntry = (listFilesResult, filePath) => {
  const pathArray = pathToArray(filePath)
  return getPath(pathArray, listFilesResult)
}

const mapToList = (obj, currentPath = '/') => {
  let result = []
  for (const [k,v] of Object.entries(obj)) {
    if(v.type !== 'directory') {
      if(isNumber(v['.']?.size)) {
        result.push({
          path:`${currentPath}${k}`,
          size: v['.'].reference?.size || v['.'].size,
          encrypted: v['.'].encryption?.scheme === 'cgck',
          link_remote_path: v['.'].reference?.path
        })
      } else {
        result = result.concat(mapToList(v, `${currentPath}${k}/`))
      }
    }
  }
  return sortBy(e => [(e.path.match(/\//g) || []).length, e.path.toLowerCase()], result)
}

const pathToArray = filePath => {
  throwIfArgsBad({filePath: FabricFilePathModel},{filePath})
  return filePath.slice(1).split('/')
}

const New = context => {
  // const logger = context.concerns.Logger;

  const _existsArgs = defObjectModel('exists()', {
    filePath: FabricFilePathModel,
    libraryId: [LibraryIdModel],
    objectId: [ObjectIdModel],
    versionHash: [VersionHashModel]
  })

  const exists = async ({filePath, libraryId, objectId, versionHash}) => {
    throwIfArgsBad(_existsArgs,{filePath, libraryId, objectId, versionHash})

    const client = await context.concerns.Client.get()
    let filesMap = await client.ListFiles({
      libraryId,
      objectId,
      versionHash
    })

    return fileEntry(filesMap, filePath) !== undefined
  }

  const fileList = async ({libraryId, objectId, versionHash}) => {
    const fmap = await filesMap({libraryId, objectId, versionHash})
    return mapToList(fmap)
  }

  const filesMap = async ({libraryId, objectId, versionHash}) => {
    const client = await context.concerns.Client.get()
    try {
      return await client.ListFiles({
        libraryId,
        objectId,
        versionHash
      })
    } catch (e) {
      // try retrieving all metadata, so we can get better error if e.g. object not found
      const objMetadata = await context.concerns.Metadata.get({libraryId, objectId, versionHash})
      if(Object.keys(objMetadata).includes('files')) {
        // should never be the case, but return anyway if somehow found
        return objMetadata.files
      } else {
        // return empty map - no files
        return {}
      }
    }
  }

  // instance interface
  return {
    exists,
    fileList,
    filesMap
  }
}

module.exports = {
  blueprint,
  fileEntry,
  mapToList,
  New,
  pathToArray
}
