// code related to working with /video_tags object metadata

const isEmpty = require('@eluvio/elv-js-helpers/Boolean/isEmpty')
const isNil = require('@eluvio/elv-js-helpers/Boolean/isNil')

const Logger = require('../kits/Logger')
const Metadata = require('./Metadata')
const FabricFile = require('./FabricFile')
const VideoTagsTracksFiles = require('./VideoTagsTracksFiles')

const blueprint = {
  name: 'VideoTagsMetadata',
  concerns: [Logger, Metadata]
}

const forFileList = fileNameList => Object({
  metadata_tags: Object.fromEntries(
    fileNameList.map(kvPairForFilename)
  )
})

const kvPairForFilename = filename => [
  VideoTagsTracksFiles.filename2Index(filename),
  FabricFile.fileLink({
    filePath: `video_tags/${filename}`
  })
]

const New = context => {

  const exists = async ({libraryId, objectId, versionHash, writeToken}) => {
    const meta = await get({libraryId, objectId, versionHash, writeToken})
    return !(isNil(meta) || !isEmpty(meta))
  }

  // read /video_tags from object metadata
  const get = async ({libraryId, objectId, versionHash, writeToken}) => await context.concerns.Metadata.get({
    libraryId,
    objectId,
    subtree: '/video_tags',
    versionHash,
    writeToken
  })

  const replace = async ({libraryId, tagsTracksListMeta, objectId, writeToken}) => {
    await context.concerns.Metadata.write({
      libraryId,
      metadata: tagsTracksListMeta,
      objectId,
      subtree: '/video_tags',
      writeToken
    })
  }

  // instance interface
  return {
    exists,
    get,
    replace,
  }
}

module.exports = {
  blueprint,
  forFileList,
  kvPairForFilename,
  New
}
