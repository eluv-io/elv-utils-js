// Code for working with files within content fabric objects

const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')
const getPath = require('@eluvio/elv-js-helpers/Functional/getPath')
const isNumber = require('@eluvio/elv-js-helpers/Boolean/isNumber')
const sortBy = require('@eluvio/elv-js-helpers/Functional/sortBy')
const throwIfArgsBad = require('@eluvio/elv-js-helpers/Validation/throwIfArgsBad')

const FabricFilePathModel = require('../../models/FabricFilePathModel')
const FabricFilePathArrayModel = require('../../models/FabricFilePathArrayModel')
const LibraryIdModel = require('../../models/LibraryIdModel')
const ObjectIdModel = require('../../models/ObjectIdModel')
const VersionHashModel = require('../../models/VersionHashModel')
const WriteTokenModel = require('../../models/WriteTokenModel')

const Client = require('../Client')
const Logger = require('../kits/Logger')
const Metadata = require('../Metadata')

const blueprint = {
  name: 'FabricFile',
  concerns: [Client, Logger, Metadata]
}

const FABRIC_FILE_DEL_ARGSMODEL = defObjectModel('FabricFile.del()', {
  filePaths: FabricFilePathArrayModel,
  libraryId: [LibraryIdModel],
  objectId: [ObjectIdModel],
  writeToken: WriteTokenModel
})

const FABRIC_FILE_READ_ARGSMODEL_FIELDS = {
  filePath: FabricFilePathModel,
  libraryId: [LibraryIdModel],
  objectId: [ObjectIdModel],
  versionHash: [VersionHashModel]
}

const FABRIC_FILE_EXISTS_ARGSMODEL = defObjectModel(
  'FabricFile.exists()',
  FABRIC_FILE_READ_ARGSMODEL_FIELDS
)

const FABRIC_FILE_PATH_INFO_ARGSMODEL = defObjectModel(
  'FabricFile.pathInfo()',
  FABRIC_FILE_READ_ARGSMODEL_FIELDS
)

const fileLink = ({filePath}) => Object({'/': `./files/${filePath}`})

const isDir = fileMapEntry => fileMapEntry['.']?.type === 'directory'

const isEncrypted = fileMapEntry => fileMapEntry['.']?.encryption?.scheme === 'cgck'

const isFile = fileMapEntry => !isDir(fileMapEntry) && !isLink(fileMapEntry)

const isLink = fileMapEntry => fileMapEntry['.']?.reference?.path !== undefined

const mapEntry = (listFilesResult, filePath) => {
  const pathArray = pathToArray(filePath)
  return getPath(pathArray, listFilesResult)
}

// Converts ListFiles response object from node Files API to
// a flat array of only files.
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

  // upload (non-S3) files to object
  const add = async ({encrypt, fileInfo, libraryId, objectId, writeToken}) => {
    const client = await context.concerns.Client.get()
    return await client.UploadFiles({
      libraryId,
      objectId,
      writeToken,
      fileInfo,
      callback: logProgressCallback,
      encryption: encrypt ? 'cgck' : 'none'
    })
  }

  const del = async ({filePaths, libraryId, objectId, writeToken}) => {
    throwIfArgsBad(FABRIC_FILE_DEL_ARGSMODEL,{filePaths, libraryId, objectId, writeToken})

    const client = await context.concerns.Client.get()

    return await client.DeleteFiles({
      libraryId,
      objectId,
      filePaths,
      writeToken
    })
  }

  // checks if a file exists
  const exists = async ({filePath, libraryId, objectId, versionHash}) => {
    throwIfArgsBad(FABRIC_FILE_EXISTS_ARGSMODEL,{filePath, libraryId, objectId, versionHash})

    let filesMap = await filesMap({
      libraryId,
      objectId,
      versionHash
    })

    const entry = mapEntry(filesMap, filePath)

    return entry !== undefined
  }


  const fileList = async ({libraryId, objectId, filePath, versionHash, writeToken}) => {
    const fMap = await filesMap({libraryId, objectId, filePath, versionHash, writeToken})
    return mapToList(fMap)
  }

  const filesMap = async ({libraryId, objectId, filePath, versionHash, writeToken}) => {
    const client = await context.concerns.Client.get()
    try {
      return await client.ListFiles({
        libraryId,
        objectId,
        path: filePath,
        versionHash,
        writeToken
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

  // log progress to console
  const logProgressCallback = progress => {
    Object.keys(progress).sort().forEach(filename => {
      const {uploaded, total} = progress[filename]
      const percentage = total === 0 ? '100.0%' : (100 * uploaded / total).toFixed(1) + '%'
      context.concerns.Logger.log(`${filename}: ${percentage}`)
    })
  }

  const pathInfo = async ({filePath, libraryId, objectId, versionHash}) => {
    throwIfArgsBad(FABRIC_FILE_PATH_INFO_ARGSMODEL,{filePath, libraryId, objectId, versionHash})
    const fMap = await filesMap({filePath, libraryId, objectId, versionHash})
    return mapEntry(fMap, filePath)
  }

  // instance interface
  return {
    add,
    del,
    exists,
    fileList,
    filesMap,
    logProgressCallback,
    pathInfo
  }
}

module.exports = {
  blueprint,
  fileLink,
  isDir,
  isEncrypted,
  isFile,
  isLink,
  mapEntry,
  mapToList,
  New,
  pathToArray
}
