const kindOf = require('kind-of')
const objectPath = require('object-path')
const R = require('@eluvio/ramda-fork')

const isString = require('@eluvio/elv-js-helpers/Boolean/isString')

const {fabricItemDesc} = require('../helpers')

const Client = require('./Client')
const Edit = require('./Edit')
const JSON = require('./JSON')
const Logger = require('./Logger')

const pathRegex = /^(\/[^/]+)+$/

const arrayToPath = arr => `/${arr.join('/')}`

const pathDesc = path => path ? `path '${path}' ` : ''

const pathExists = ({metadata, path}) => objectPath.has(metadata, pathToArray({path}))

const pathPieceIsInt = str => parseInt(str, 10).toString() === str

// convert path in slash format to an array for use with object-path
// numbers are assumed to be array indexes rather than map keys
// path must start with "/"
const pathToArray = ({path}) => {
  if (!path) throw Error('Metadata.pathToArray(): path not supplied')
  if (!isString(path)) throw Error('Metadata.pathToArray(): path must be a string')
  if (path.slice(0, 1) !== '/') throw Error('Metadata.pathToArray(): path must start with \'/\'')
  let result = path.split('/')
  // remove empty string at beginning (should always be present)
  result.shift()
  // if we have an empty string at end, remove (path ended with '/')
  if (result.slice(-1)[0] === '') result.pop()

  return result
}

const pretty = ({obj}) => JSON.stringify(obj, null, 2)

const skeleton = () => Object({public: {}})

const validatePathExists = ({metadata, path}) => {
  if (!pathExists({metadata, path})) throw Error(`'${path}' not found in metadata`)
}

const validatePathFormat = ({path}) => {
  if (!validPathFormat({path})) throw Error(`'${path}' is not in valid format for a metadata path (make sure it starts with '/')`)
}

// Check that path can be set (creating parents if needed)
// Throw error otherwise
// (does not check if data already exists at the full targetPath - only
// checks that writing to targetPath is not blocked by a non-object value earlier in object)
const validateTargetPath = ({metadata, path}) => {
  const pathArr = pathToArray({path})
  if (objectPath.has(metadata, pathArr)) return true

  while (pathArr.length > 0) {
    const key = pathArr.pop()
    if (objectPath.has(metadata, pathArr)) {
      // get parent value (if it exists)
      const value = objectPath.get(metadata, pathArr)
      // check that key is valid
      switch (kindOf(value)) {
        case 'object':
        case 'undefined': // not expected, but allow it
          return true
        case 'array':
          if (pathPieceIsInt(key)) {
            const i = parseInt(key, 10)
            if (i < 0 || i > value.length) throw Error(`${path} is not a valid target metadata path, ${arrayToPath(pathArr)} contains an array of length ${value.length} (${key} is not a valid index for setting or adding a value)`)
          } else {
            throw Error(`${path} is not a valid target metadata path, ${arrayToPath(pathArr)} contains an array and '${key}' is not a valid array index`)
          }
          return true // array index is valid
        default:
          throw Error(`${path} is not a valid target metadata path, ${arrayToPath(pathArr)} contains a value that cannot have children added`)
      }
    }
  }
}

const validPathFormat = ({path}) => path.match(pathRegex) && path.match(pathRegex)[0] === path

// Makes sure all attributes along object path are objects or undefined, and that path ends at an undefined attribute
const validTargetPath = ({metadata, targetPath}) => {
  let pathArr = pathToArray({path: targetPath})
  let currentSubtree = R.clone(metadata)

  for (const key of pathArr) {

    if (currentSubtree === undefined) {
      // reached end of tree, all the rest of keys in targetPath can be created under this point
      return true
    }
    if (kindOf(currentSubtree) !== 'object') {
      break
    }
    currentSubtree = currentSubtree[key]
  }
  // Make sure end is undefined
  return currentSubtree === undefined
}

const valueAtPath = ({metadata, path}) => objectPath.get(metadata, pathToArray({path}))


const blueprint = {
  name: 'Metadata',
  concerns: [Logger, Client, Edit]
}

const New = context => {
  const logger = context.concerns.Logger

  const checkTargetPath = ({force, metadata, targetPath}) => {
    if (!validTargetPath({metadata, targetPath})) {
      const existingExcerpt = JSON.shortString({
        obj: valueAtPath({
          metadata,
          path: targetPath
        })
      })
      if (force) {
        logger.warn(`Data already exists at '${targetPath}', --force specified, replacing...\nOverwritten data: ${existingExcerpt}`)
      } else {
        throw new Error(`Metadata path '${targetPath}' is invalid (already exists, use --force to replace). Existing data: ${existingExcerpt}`)
      }
    }
  }

  const commitInfo = async ({libraryId, objectId, versionHash, writeToken}) => {
    // logger.log(`Retrieving commit info for ${fabricItemDesc({objectId, versionHash, writeToken})}...`)
    return await get({
      libraryId,
      objectId,
      subtree: '/commit',
      versionHash,
      writeToken
    })
  }

  const get = async ({libraryId, subtree, objectId, versionHash, writeToken}) => {
    const client = await context.concerns.Client.get()
    logger.log(`Retrieving metadata ${pathDesc(subtree)}from ${fabricItemDesc({objectId, versionHash, writeToken})}...`)
    return await client.ContentObjectMetadata({
      libraryId,
      metadataSubtree: subtree,
      objectId,
      versionHash,
      writeToken
    })
  }

  const write = async ({commitMessage, libraryId, metadata, noWait, objectId, subtree, writeToken}) => {
    return await context.concerns.Edit.writeMetadata({
      commitMessage,
      libraryId,
      metadata,
      metadataSubtree: subtree,
      noWait,
      objectId,
      writeToken,
    })
  }

  return {
    checkTargetPath,
    commitInfo,
    get,
    write
  }
}

module.exports = {
  blueprint,
  pathExists,
  pathToArray,
  pretty,
  New,
  skeleton,
  validatePathExists,
  validatePathFormat,
  validateTargetPath,
  validPathFormat,
  validTargetPath,
  valueAtPath
}
