// code related to adding S3 files to fabric
const path = require('path')

const groupBy = require('@eluvio/elv-js-helpers/Functional/groupBy')

const FabricFilesAdd = require('./FabricFilesAdd.js')
const ArgS3Copy = require('../args/ArgS3Copy')
const ArgS3Reference = require('../args/ArgS3Reference')
const Client = require('../Client')
const CloudAccess = require('./CloudAccess')
const RemoteAccessList = require('../libs/RemoteAccessList')
const Logger = require('./Logger')

// Note that we don't always check for --s3Copy or --s3Reference because
// utilities that use this kit also generally include LocalFile
const chkS3CredentialsButNoS3CopyOrRef = (argv) => {
  if(argv.S3Credentials) {
    if(!argv.s3Copy && !argv.s3Reference) {
      throw Error('Neither --s3Copy nor --s3Reference specified')
    }
  }
  return true // tell yargs that the arguments passed the check
}

// groupByPathMatch : Object [string] -> Object | EXCEPTION
// Group the cloud storage files by first matching PathsRemoteAccess, check each file's source path against each pathRemoteAccess's path_matchers
// Returns an object keyed by found index:
// {
//   '-1': [source paths that found no match],
//   0: [source paths that matched the first pathsRemoteAccess],
//   1: [source paths that matched the second pathsRemoteAccess],
//   ...
// }
//
// Throws an exception if a source path matches an incompatible RemoteAccess - see matchingRemoteAccessListSetIndex()
const groupByPathMatch = (remoteAccessList, s3SourcePathList) => groupBy(RemoteAccessList.matchingElementIndex(remoteAccessList), s3SourcePathList)

const blueprint = {
  name: 'CloudFile',
  concerns: [
    FabricFilesAdd,
    ArgS3Copy,
    ArgS3Reference,
    CloudAccess,
    Client,
    Logger
  ],
  checksMap: {chkS3CredentialsButNoS3CopyOrRef}
}

const New = context => {

  const add = async ({
    libraryId,
    objectId,
    writeToken
  }) => {

    const {
      files,
      storeClear,
      s3Copy,
      s3Reference
    } = context.args

    if (!s3Copy && !s3Reference) throw Error('Neither --s3Copy nor --s3Reference were specified')

    const remoteAccessList = context.concerns.CloudAccess.remoteAccessList()

    const groupedFiles = groupByPathMatch(remoteAccessList, files)
    if(groupedFiles['-1']) {
      throw Error(`No matching remote access credentials found for file path(s): ${groupedFiles['-1'].join('\n')}`)
    }

    const client = await context.concerns.Client.get()

    // iterate over file groups, add to fabric object using RemoteAccess for group
    for(const [index, matchedSourcePaths] of Object.entries(groupedFiles)) {
      const access = remoteAccessList[index].remote_access

      const params = {
        accessKey: access?.cloud_credentials?.access_key_id,
        bucket: access?.path,
        callback: context.concerns.Logger.log,
        copy: !!s3Copy,
        encryption: (!s3Reference && !storeClear) ? 'cgck' : 'none',
        fileInfo: fileInfo(matchedSourcePaths),
        libraryId,
        objectId,
        region: access?.storage_endpoint.region,
        secret: access?.cloud_credentials?.secret_access_key,
        writeToken
      }
      console.log(JSON.stringify(params,null,2))

      await client.UploadFilesFromS3(params)
      // await client.UploadFilesFromS3({
      //   accessKey: access?.cloud_credentials?.access_key_id,
      //   bucket: access?.path,
      //   callback: context.concerns.Logger.log,
      //   copy: s3Copy,
      //   encryption: (!s3Reference && !storeClear) ? 'cgck' : 'none',
      //   fileInfo: fileInfo(matchedSourcePaths),
      //   libraryId,
      //   objectId,
      //   region: access?.path,
      //   secret: access?.cloud_credentials?.secret_access_key,
      //   writeToken
      // })
    }
  }

  const fileInfo = (sourceFiles) => {
    const {destDir} = context.args
    return sourceFiles.map(
      (sourcePath) => {
        const destPath = (destDir ? destDir + '/' : '') + path.basename(sourcePath)
        return {
          path: destPath,
          source: sourcePath,
        }
      }
    )
  }

  // instance interface
  return {
    add,
    fileInfo
  }
}

module.exports = {
  blueprint,
  New
}
