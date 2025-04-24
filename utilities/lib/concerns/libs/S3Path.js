// code related to working with S3 file paths
const URI = require('./URI')

const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const Logger = require('../kits/Logger')

const blueprint = {
  name: 'S3Path',
  concerns: [Logger]
}

const TYPE_PLAIN = 'plain' // no protocol or bucket, e.g. 'myDir/foo.txt'
const TYPE_SIGNED = 's3signed' // signed URL, e.g. 'http://bucket/myDir/foo.txt'
const TYPE_UNSIGNED = 's3unsigned' // unsigned s3 path, e.g. 's3://bucket/myDir/foo.txt'

// parse : string -> Object
// Parses source path info based on whether it is:
//   a plain path
//   an s3 unsigned url "s3://..."
//   an s3 signed url "http://...?X-Amz-..."
//
// Returns an object {pathBucket, pathType, pathInBucket}
const parse = sourcePath => {
  let uri

  let pathBucket

  let pathInBucket

  uri = URI.normalizedURI(sourcePath)
  const pathType = uriType(uri)

  switch(pathType) {
    case TYPE_PLAIN:
      pathInBucket = sourcePath
      break
    case TYPE_SIGNED:
    case TYPE_UNSIGNED:
      pathBucket = uriBucket(uri)
      pathInBucket = uriPathInBucket(uri)
      break
    default:
      // not expected, but check in case of future code changes:
      throw Error(`Unrecognized S3 path type "${pathType}"`)
  }

  return {
    pathBucket,
    pathType,
    pathInBucket
  }
}

// uriBucket : URI -> string
// Returns a string containing the bucket name, e.g.:
// uriBucket(URI("s3://myHost/myBucket/foo/bar/video.mp4")) === "myBucket"
const uriBucket = uri => {
  if (uriIsPlainPath(uri)) throw Error(`uriPathBucket() - path must start with a protocol e.g. s3:// (path: ${uri.toString()})`)
  const bucket = uri.segmentCoded(0)
  if(bucket === '') throw Error(`uriPathBucket() - url is too short, no bucket found (path: ${uri.toString()})`)
  return bucket
}

// uriIsPlainPath : URI -> boolean
// Returns true if uri has no protocol and
const uriIsPlainPath = uri => uri.protocol === ''

// uriIsUnsignedS3URL : URI -> boolean
// Returns true if uri looks like a standard s3 URL "s3://bucket/file_path"
const uriIsUnsignedS3URL = uri => uri.is('url') &&
  uri.is('absolute') &&
  // starts with "s3://"
  uri.protocol() === 's3' &&
  // doesn't end in '/'
  uri.filename() !== '' &&
  // has a bucket (URI.normalizedURI will put interpret bucket name as hostname)
  uri.hostname() !== '' &&
  // doesn't have query params
  uri.query() === ''

// uriIsSignedURL: uri -> boolean
// returns true if uri looks like an S3 signed URL "http(s)://bucket/file_path?X-Amz..."
const uriIsSignedURL = uri => URI.isHttpUrl(uri) &&
  // doesn't end in '/'
  uri.filename() !== '' &&
  // has a bucket
  uri.directory() !== '' &&
  // has at least the following 4 S3 query parameters
  uri.hasQuery('X-Amz-Credential') &&
  uri.hasQuery('X-Amz-Security-Token') &&
  uri.hasQuery('X-Amz-Signature') &&
  uri.hasQuery('X-Amz-Credential')

// uriType : URI -> string | EXCEPTION
// Returns the S3 Path type
const uriType = uri => uriIsSignedURL(uri) ?
  TYPE_SIGNED
  : uriIsUnsignedS3URL(uri) ?
    TYPE_UNSIGNED
    : uriIsPlainPath(uri) ?
      TYPE_PLAIN
      : throwError(`S3Path.uriType - could not determine path type (path: ${uri.toString()})`)

// uriPathInBucket : URI -> string
// Returns a string containing the path after the bucket name, e.g.:
// uriPathInBucket(URI("s3://myHost/myBucket/foo/bar/video.mp4")) === "/foo/bar/video.mp4"
const uriPathInBucket = uri => {
  if (uriIsPlainPath(uri)) throw Error(`uriPathWithinBucket() - path must start with a protocol e.g. s3:// (path: ${uri.toString()})`)
  const pathAfterBucket = uri.pathname()
  if(pathAfterBucket === '') throw Error(`uriPathWithinBucket() - no path found after bucket (uri: ${uri.toString()})`)
  return pathAfterBucket
}

const New = () => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  New,
  parse,
  TYPE_PLAIN,
  TYPE_SIGNED,
  TYPE_UNSIGNED,
  uriBucket,
  uriIsPlainPath,
  uriIsSignedURL,
  uriIsUnsignedS3URL,
  uriPathInBucket,
  uriType
}
