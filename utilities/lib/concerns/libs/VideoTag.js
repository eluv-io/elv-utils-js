// code related to working with video tags

const Logger = require('../Logger')
const FabricFile = require('./FabricFile')
const Metadata = require('./Metadata')

const blueprint = {
  name: 'VideoTag',
  concerns: [Logger, Metadata, FabricFile]
}

const New = context => {

  // read /video_tags from object files and return recursive list of files
  const getFileList = async ({libraryId, objectId, versionHash, writeToken}) => await context.concerns.FabricFile.fileList({
    libraryId,
    objectId,
    filePath: '/video_tags',
    versionHash,
    writeToken
  })

  // read /video_tags from object metadata
  const getMetadata = async ({libraryId, objectId, versionHash, writeToken}) => await context.concerns.Metadata.get({
    libraryId,
    objectId,
    subtree: '/video_tags',
    versionHash,
    writeToken
  })

  // instance interface
  return {
    getFileList,
    getMetadata
  }
}

module.exports = {
  blueprint,
  New
}
