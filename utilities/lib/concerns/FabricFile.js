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
const Logger = require('./kits/Logger.js')
const Metadata = require('./libs/Metadata.js')

const blueprint = {
  name: 'FabricFile',
  concerns: [Client, Logger, Metadata]
}

const READ_FILE_PATH_ARGS_MODEL = defObjectModel('exists()', {
  filePath: FabricFilePathModel,
  libraryId: [LibraryIdModel],
  objectId: [ObjectIdModel],
  versionHash: [VersionHashModel]
})

const isDir = fileMapEntry => fileMapEntry['.']?.type === 'directory'

const isEncrypted = fileMapEntry => fileMapEntry['.']?.encryption?.scheme === 'cgck'

const isFile = fileMapEntry => !isDir(fileMapEntry) && !isLink(fileMapEntry)

const isLink = fileMapEntry => fileMapEntry['.']?.reference?.path !== undefined

const mapEntry = (listFilesResult, filePath) => {
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
          encrypted: isEncrypted(v),
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

  // checks if a file exists
  const exists = async ({filePath, libraryId, objectId, versionHash}) => {
    throwIfArgsBad(READ_FILE_PATH_ARGS_MODEL,{filePath, libraryId, objectId, versionHash})

    let filesMap = await filesMap({
      libraryId,
      objectId,
      versionHash
    })

    const entry = mapEntry(filesMap, filePath)

    return entry !== undefined
  }

  const fileList = async ({libraryId, objectId, versionHash, writeToken}) => {
    const fMap = await filesMap({libraryId, objectId, versionHash, writeToken})
    return mapToList(fMap)
  }

  const filesMap = async ({libraryId, objectId, versionHash, writeToken}) => {
    const client = await context.concerns.Client.get()
    try {
      return await client.ListFiles({
        libraryId,
        objectId,
        versionHash,
        writeToken
      })
    } catch (e) {
      // try retrieving all metadata, so we can get better error if e.g. object not found
      const objMetadata = await context.concerns.Metadata.get({libraryId, objectId, versionHash, writeToken})
      if(Object.keys(objMetadata).includes('files')) {
        // should never be the case, but return anyway if somehow found
        return objMetadata.files
      } else {
        // return empty map - no files
        return {}
      }
    }
  }

  const pathInfo = async ({filePath, libraryId, objectId, versionHash}) => {
    throwIfArgsBad(READ_FILE_PATH_ARGS_MODEL,{filePath, libraryId, objectId, versionHash})
    const fMap = await filesMap({libraryId, objectId, versionHash})
    return mapEntry(fMap, filePath)
  }

  // instance interface
  return {
    exists,
    fileList,
    filesMap,
    pathInfo
  }
}

module.exports = {
  blueprint,
  isDir,
  isEncrypted,
  isFile,
  isLink,
  mapEntry,
  mapToList,
  New,
  pathToArray
}
