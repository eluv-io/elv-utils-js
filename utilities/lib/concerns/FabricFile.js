// Code for working with files and directories within content fabric objects
const path = require('path')

const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')
const defNonEmptyArrModel = require('@eluvio/elv-js-helpers/ModelFactory/defNonEmptyArrModel')
const getPath = require('@eluvio/elv-js-helpers/Functional/getPath')
const sortBy = require('@eluvio/elv-js-helpers/Functional/sortBy')
const throwIfArgsBad = require('@eluvio/elv-js-helpers/Validation/throwIfArgsBad')

const FabricFilePathModel = require('../models/FabricFilePathModel')
const FabricPathModel = require('../models/FabricPathModel')
const LibraryIdModel = require('../models/LibraryIdModel')
const ObjectIdModel = require('../models/ObjectIdModel')
const VersionHashModel = require('../models/VersionHashModel')
const WriteTokenModel = require('../models/WriteTokenModel')

const Client = require('./Client')
const Logger = require('./Logger')
const Metadata = require('./Metadata')

const blueprint = {
  name: 'FabricFile',
  concerns: [Client, Logger, Metadata]
}

const isDir = fileMapEntry => fileMapEntry['.']?.type === 'directory'

const isEncrypted = fileMapEntry => fileMapEntry['.']?.encryption?.scheme === 'cgck'

const isFile = fileMapEntry => !isDir(fileMapEntry) && !isLink(fileMapEntry)

const isLink = fileMapEntry => fileMapEntry['.']?.reference?.path !== undefined

// mapEntry - retrieves specified path from ElvClient.ListFiles() response
const mapEntry = (listFilesResult, filePath) => {
  const pathArray = pathToArray(filePath)
  return getPath(pathArray, listFilesResult)
}

// mapToList - converts nested data from ElvClient.ListFiles into a flat array
// e.g.
//
// {
//   ".": {
//     "type": "directory"
//   },
//   "dist": {
//     ".": {
//       "type": "directory"
//     },
//     "assets": {
//       ".": {
//         "type": "directory"
//       },
//       "model.glb": {
//         ".": {
//           "encryption": {
//             "scheme": "none"
//           },
//           "parts": [
//             2
//           ],
//           "size": 2186792
//         }
//       }
//     },
//     "index.html": {
//       ".": {
//         "encryption": {
//           "scheme": "none"
//         },
//         "parts": [
//           0
//         ],
//         "size": 918
//       }
//     }
//   },
//   "temp.json": {
//     ".": {
//       "encryption": {
//         "scheme": "none"
//       },
//       "parts": [
//         3
//       ],
//       "size": 5
//     }
//   }
// }
//
// gets converted to:
//
// [
//   {
//     "path": "/dist",
//     "type": "directory"
//   },
//   {
//     "path": "/dist/assets",
//     "type": "directory"
//   },
//   {
//     "path": "/dist/assets/model.glb",
//     "size": 2186792,
//     "encrypted": false,
//     "type": "file"
//   },
//   {
//     "path": "/dist/index.html",
//     "size": 918,
//     "encrypted": false,
//     "type": "file"
//   },
//   {
//     "path": "/temp.json",
//     "size": 5,
//     "encrypted": false,
//     "type": "file"
//   }
// ]
const mapToList = (obj, currentPath = '/') => {
  let result = []
  for (const [k, v] of Object.entries(obj)) {
    // `k` is either the name of a child file/directory or the special value "."
    // `v` is a map, which also has a key "." within.
    //
    // If `k === '.'`, `v` is always `{type:'directory'}`
    //
    // This can be confusing because
    //   * The fabric uses the literal value "." as a special key
    //   * Looking inside the `ElvClient.ListFiles()` response, you can see cases where "." points to values other than `{type:'directory'}`
    //   * This function is recursive. It only calls itself for cases where `k` is a subdirectory name, in which case `k['.']` will always `=== {type:'directory'}`
    //
    // Note the possible cases for `k` (one of the keys of the parent `obj`) and `v` (the child sub-object that `k` points to)
    //
    //   k === '.'
    //      WHEN k === '.', IT IS ALWAYS THE CASE THAT v === {type:'directory'}
    //
    //   k !== '.'
    //      k IS A NAME OF A FILE (/k) OR SUBDIRECTORY (/k/)
    //      v IS A MAP, WHICH WILL ALWAYS CONTAIN A KEY '.' THAT ITSELF POINTS TO ANOTHER (GRANDCHILD) OBJECT
    //         IF k IS THE NAME OF A FILE, v WILL ONLY HAVE THAT SINGLE KEY '.'
    //            THE GRANDCHILD v['.'] WILL CONTAIN FILE ATTRIBUTES (e.g. size)
    //            THE GRANDCHILD v['.'] WILL NOT CONTAIN 'type' NOR '.' AS KEYS
    //
    //         IF k IS THE NAME OF A SUBDIRECTORY, v WILL HAVE ADDITIONAL KEYS BESIDES '.'
    //            THE GRANDCHILD v['.'] WILL CONTAIN {type:'directory'}
    //            THE OTHER KEYS BESIDES '.' INSIDE v WILL BE NAMES OF FILES/SUBDIRECTORIES WITHIN /k/

    // Ignore the '.' key for the currentPath (directory listing always contains ".": {"type":"directory"} )
    if (k !== '.') {
      // get grandchild
      const kInfo = v['.']
      // check grandchild to see if 'k' is the name of a subdirectory
      if (kInfo.type === 'directory') {
        // yes, k is the name of a subdirectory
        // add an entry for the subdirectory to result array
        result.push({
          path: `${currentPath}${k}`,
          type: 'directory'
        })
        // recursively call to process subdirectory contents
        result = result.concat(mapToList(v, `${currentPath}${k}/`))
      } else {
        // no, k is the name of a file
        // add an entry for the file to result array
        result.push({
          path: `${currentPath}${k}`,
          size: v['.'].reference?.size || v['.'].size,
          encrypted: isEncrypted(v),
          link_remote_path: v['.'].reference?.path,
          type: 'file'
        })
      }
    }
  }
  return sortBy(e => [e.path.toLowerCase(), e.path], result)
}

const pathToArray = filePath => {
  throwIfArgsBad({filePath: FabricPathModel}, {filePath})
  return filePath === '/'
    ? []
    : filePath.slice(1).split('/')
}

const New = context => {
  // const logger = context.concerns.Logger;

  // pathExists - checks if a file or directory exists
  const PATH_EXISTS_ARGS_MODEL = defObjectModel('FabricFile.pathExists()', {
    libraryId: [LibraryIdModel],
    objectId: [ObjectIdModel],
    filePath: FabricPathModel,
    versionHash: [VersionHashModel],
    writeToken: [WriteTokenModel]
  })
  const pathExists = async (params) => {
    throwIfArgsBad(PATH_EXISTS_ARGS_MODEL, params)
    const {filePath, libraryId, objectId, versionHash, writeToken} = params

    let filesMap = await itemMap({
      libraryId,
      objectId,
      versionHash,
      writeToken
    })

    const entry = mapEntry(filesMap, filePath)

    return entry !== undefined
  }

  const itemList = async ({libraryId, objectId, versionHash, writeToken}) => {
    const fMap = await itemMap({libraryId, objectId, versionHash, writeToken})
    return mapToList(fMap)
  }

  const ITEM_MAP_MEMO = {} // memoization store
  const itemMap = async ({libraryId, objectId, versionHash, writeToken}) => {
    const memoKey = JSON.stringify({libraryId, objectId, versionHash, writeToken})
    if (memoKey in ITEM_MAP_MEMO) return ITEM_MAP_MEMO[memoKey]

    const client = await context.concerns.Client.get()
    try {
      const result = await client.ListFiles({
        libraryId,
        objectId,
        versionHash,
        writeToken
      })
      ITEM_MAP_MEMO[memoKey] = result
      return result
    } catch (e) {
      // try retrieving all metadata, so we can get better error if e.g. object not found
      const objMetadata = await context.concerns.Metadata.get({libraryId, objectId, versionHash, writeToken})
      if (Object.keys(objMetadata).includes('files')) {
        // should never be the case, but return anyway if somehow found
        return objMetadata.files
      } else {
        // return empty map - no files
        return {}
      }
    }
  }

  // move - imitate semantics of the Linux 'mv' command.
  // If there is a single source and dest is an existing directory, then move source into directory
  // If there is a single source and dest is not an existing directory, then rename source to dest (and move as needed -
  // but implied dest directory must exist).
  // If there are multiple sources, dest must be an existing directory
  // NOTE: Cannot move a directory into a child of itself
  const MOVE_ARGS_MODEL = defObjectModel('FabricFile.move()', {
    dest: FabricPathModel,
    libraryId: [LibraryIdModel],
    objectId: [ObjectIdModel],
    sources: defNonEmptyArrModel('sources', FabricFilePathModel),
    writeToken: WriteTokenModel
  })
  const move = async (params) => {
    throwIfArgsBad(MOVE_ARGS_MODEL, params)
    const {dest, libraryId, objectId, sources, writeToken} = params

    if (sources.length === 1) {
      // single source, dest is either a new directory or new full path name (to rename and/or move file)

      const source = sources[0]
      // make sure source exists
      if (!await pathExists({
        filePath: source,
        libraryId,
        objectId,
        writeToken
      })) throw Error(`Source ${source} not found.`)

      // see if dest exists
      if (await pathExists({filePath: dest, libraryId, objectId, writeToken})) {
        // single source and dest exists, make sure it is a directory
        const destInfo = await pathInfo({filePath: dest, libraryId, objectId, writeToken})
        if (!isDir(destInfo)) throw Error(`Destination ${dest} already exists and is not a directory.`)

        // we are moving single item to new directory (without renaming)
        // make sure dest dir is not a child of source
        if (dest.startsWith(source)) throw Error(`Destination ${dest} is inside source ${source}`)

        // move our single item
        const destPath = dest + '/' + path.basename(source)
        const client = await context.concerns.Client.get()
        await client.MoveFiles({libraryId, objectId, writeToken, filePaths: [{'path': source, to: destPath}]})
      } else {
        // single source and dest does not exist, we are renaming (and also possibly moving)
        const destDir = path.dirname(dest)
        if (!await pathExists({
          filePath: destDir,
          libraryId,
          objectId,
          writeToken
        })) throw Error(`Destination directory ${destDir} does not exist.`)
        const destInfo = await pathInfo({filePath: destDir, libraryId, objectId, writeToken})
        if (!isDir(destInfo)) throw Error(`Destination directory ${destDir} is not a directory.`)
        // make sure dest dir is not a child of source
        if (destDir.startsWith(source)) throw Error(`Destination ${destDir} is inside source ${source}`)

        const client = await context.concerns.Client.get()
        await client.MoveFiles({libraryId, objectId, writeToken, filePaths: [{'path': source, to: dest}]})
      }

    } else {
      // multiple sources
      // make sure dest exists and is a directory
      if (!await pathExists({
        filePath: dest,
        libraryId,
        objectId,
        writeToken
      })) throw Error(`Destination directory ${dest} not found.`)
      const destInfo = await pathInfo({filePath: dest, libraryId, objectId, writeToken})
      if (!isDir(destInfo)) throw Error(`Destination ${dest} is not a directory.`)

      // make sure sources exist and are not parents of dest
      const filePaths = []
      for (const source in sources) {
        if (!await pathExists({
          filePath: source,
          libraryId,
          objectId,
          writeToken
        })) throw Error(`Source ${source} not found.`)
        if (dest.startsWith(source)) throw Error(`Destination ${dest} is inside source item ${source}`)
        const destPath = dest + '/' + path.basename(source)
        filePaths.push({'path': source, to: destPath})
      }
      const client = await context.concerns.Client.get()
      await client.MoveFiles({libraryId, objectId, writeToken, filePaths})
    }
  }

  // pathInfo - return information about a single path within object
  const PATH_INFO_ARGS_MODEL = defObjectModel('FabricFile.pathInfo()', {
    libraryId: [LibraryIdModel],
    objectId: [ObjectIdModel],
    filePath: FabricPathModel,
    versionHash: [VersionHashModel],
    writeToken: [WriteTokenModel]
  })
  const pathInfo = async (params) => {
    throwIfArgsBad(PATH_INFO_ARGS_MODEL, params)
    const {filePath, libraryId, objectId, versionHash, writeToken} = params
    const fMap = await itemMap({libraryId, objectId, versionHash, writeToken})
    return mapEntry(fMap, filePath)
  }

  // instance interface
  return {
    itemList,
    itemMap,
    move,
    pathExists,
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
