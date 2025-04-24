/*
code related to working with RemoteAccessLists

A Remote Access List is an array of PathsRemoteAccess objects, each with a set of source file path
matchers and a RemoteAccess object

A basic 1-element RemoteAccessList that matches all paths:

  [
    {
      path_matchers: ['.*'],
      remote_access: {
        protocol: 's3',
        platform: 'aws',
        path: 'MY_AWS_BUCKET',
        storage_endpoint: {
          region: 'MY_AWS_REGION'
        },
        cloud_credentials: {
          access_key_id: 'MY_AWS_KEY',
          secret_access_key: 'MY_AWS_SECRET'
        }
      }
    }
  ]

Self-signed URLs do not need AWS_KEY / AWS_SECRET / AWS_BUCKET / AWS_REGION but use the URL as cloud credentials

   [
    {
      path_matchers: ['.*'],
      remote_access: {
        protocol: 's3',
        platform: 'aws',
        storage_endpoint: {},
        cloud_credentials: {
          signed_url: 'MY_AWS_KEY'
        }
      }
    }
  ]

 */


const curry = require('@eluvio/elv-js-helpers/Functional/curry')

const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')

const throwIfArgsBad = require('@eluvio/elv-js-helpers/Validation/throwIfArgsBad')

const {PathsRemoteAccessModel, RemoteAccessListModel} = require('../../models/RemoteAccessListModels')

const Logger = require('../kits/Logger')
const S3Path = require('./S3Path')

const blueprint = {
  name: 'RemoteAccessList',
  concerns: [Logger]
}

const ELEMENT_MATCHES_SOURCE_PATH_ARGSMODEL = defObjectModel(
  'RemoteAccessList.elementMatchesSourcePath()',
  {
    pathsRemoteAccess:PathsRemoteAccessModel,
    sourcePath: NonBlankStrModel
  }
)

// elementMatchesSourcePath : Object string -> boolean | EXCEPTION
// Tests if sourcePath matches any of the RegExps created from PathsRemoteAccess.path_matchers
// Throws an exception if match is found but sourcePath is incompatible with RemoteAccess
const elementMatchesSourcePath =  (pathsRemoteAccess, sourcePath) => {
  throwIfArgsBad(
    ELEMENT_MATCHES_SOURCE_PATH_ARGSMODEL,
    {pathsRemoteAccess, sourcePath}
  )

  const matchFound = pathsRemoteAccess.path_matchers.find(pattern => (new RegExp(pattern)).test(sourcePath))
  if(matchFound) validateElementForPath(pathsRemoteAccess, sourcePath)

  return matchFound
}

const MATCHING_ELEMENT_INDEX_ARGSMODEL = defObjectModel(
  'RemoteAccessList.matchingElementIndex()',
  {
    remoteAccessList:RemoteAccessListModel,
    sourcePath: NonBlankStrModel
  }
)

// matchingElementIndex : [Object] -> string -> integer | EXCEPTION
// Finds index of first PathsRemoteAccess that matches the sourcePath
// Returns -1 if no matching set found
// Throws error if a path match is found but the RemoteAccess is incompatible (either missing info not included in sourcePath,
// or containing info that conflicts with sourcePath)
// Function is curried, will return a single-argument function (with remoteAccessList bound as a closure) if only 1 argument provided.
const matchingElementIndex = curry(
  (remoteAccessList, sourcePath) => {
    throwIfArgsBad(
      MATCHING_ELEMENT_INDEX_ARGSMODEL,
      {remoteAccessList, sourcePath}
    )
    return remoteAccessList.findIndex(
      (pathsRemoteAccess) => elementMatchesSourcePath(pathsRemoteAccess, sourcePath)
    )
  }
)

const VALIDATE_ELEMENT_FOR_PATH_ARGSMODEL = defObjectModel(
  'RemoteAccessList.validateElementForPath()',
  {
    pathsRemoteAccess: PathsRemoteAccessModel,
    sourcePath: NonBlankStrModel
  }
)

const validateElementForPath = (pathsRemoteAccess, sourcePath) => {
  throwIfArgsBad(
    VALIDATE_ELEMENT_FOR_PATH_ARGSMODEL,
    {pathsRemoteAccess, sourcePath}
  )

  // check RemoteAccess fields based on path type and (if present) path bucket
  const {pathBucket, pathType} = S3Path.parse(sourcePath)

  // Prepare error messages
  let errorStart
  switch(pathType) {
    case S3Path.TYPE_PLAIN:
      errorStart = 'Plain S3 path without s3://BUCKET_NAME'
      break
    case S3Path.TYPE_SIGNED:
      errorStart = 'S3 Signed URL http(s)://BUCKET_NAME/PATH'
      break
    case S3Path.TYPE_UNSIGNED:
      errorStart = 'Standard S3 URL s3://BUCKET_NAME/PATH'
      break
    default:
      // not expected, but check in case of future code changes:
      throw Error(`Unrecognized S3 path type "${pathType}"`)
  }

  const errorEnd = ` (path: ${sourcePath}, path_matchers: ${JSON.stringify(pathsRemoteAccess.path_matchers)})`

  // Check for secret/key/region needed (all except signed URL)
  if(pathType !== S3Path.TYPE_SIGNED) {
    // AWS_SECRET
    if(!pathsRemoteAccess.remote_access?.cloud_credentials?.secret_access_key) {
      throw Error(errorStart + ' needs AWS_SECRET. Please make sure env var AWS_SECRET is set (or supplied in file specified with --credentials) ' + errorEnd)
    }
    // AWS_KEY
    if(!pathsRemoteAccess.remote_access?.cloud_credentials?.access_key_id) {
      throw Error(errorStart + ' needs AWS_KEY. Please make sure env var AWS_KEY is set (or supplied in file specified with --credentials) ' + errorEnd)
    }
    // AWS_REGION (in future, presence of AWS_ENDPOINT_URL may change this logic)
    if(!pathsRemoteAccess.remote_access?.path) {
      throw Error(errorStart + ' needs AWS_REGION. Please make sure env var AWS_REGION is set (or supplied in file specified with --credentials) ' + errorEnd)
    }
  }

  // Check if bucket needed - only plain paths without protocol + bucket need bucket in RemoteAccess
  if(pathType === S3Path.TYPE_PLAIN) {
    if(!pathsRemoteAccess.remote_access?.path) {
      throw Error(errorStart + ' needs AWS_BUCKET. Please make sure env var AWS_BUCKET is set (or supplied in file specified with --credentials) ' + errorEnd)
    }
  } else if(pathType !== S3Path.TYPE_SIGNED) {
    // check for bucket mismatch
    if(!pathsRemoteAccess.remote_access?.path && (pathsRemoteAccess.remote_access?.path !== pathBucket)) {
      throw Error(errorStart + ` contains bucket name '${pathBucket}' but it does not match supplied AWS_BUCKET value '${pathsRemoteAccess.remote_access?.path}'  ` + errorEnd)
    }
  }
}

const New = () => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  elementMatchesSourcePath,
  matchingElementIndex,
  New,
  validateElementForPath
}
