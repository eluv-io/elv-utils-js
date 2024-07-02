// code related to working with video tags

// TODO: const throwIfArgsBad = require('@eluvio/elv-js-helpers/Validation/throwIfArgsBad')

const {TAG_TRACK_SLICE_DUR_SEC, VideoTagTracksInputModel} = require('../../models/VideoTagModels')


const Logger = require('../kits/Logger')
const VideoTagsMetadata = require('./VideoTagsMetadata')
const VideoTagsTracksFiles = require('./VideoTagsTracksFiles')

const blueprint = {
  name: 'VideoTag',
  concerns: [Logger, VideoTagsMetadata, VideoTagsTracksFiles]
}

// Validates a set of tag tracks used as input
const validateTagTracksInput = (input) => VideoTagTracksInputModel(input)

const New = context => {

  const filesExist = async ({libraryId, objectId, versionHash, writeToken}) =>
    await context.concerns.VideoTagsTracksFiles.exist({libraryId, objectId, versionHash, writeToken})


  const metaExists = async ({libraryId, objectId, versionHash, writeToken}) =>
    await context.concerns.VideoTagsMetadata.exists({libraryId, objectId, versionHash, writeToken})

  const replace = async ({encrypt, libraryId, objectId, offeringDurSec, tagTracks, writeToken}) => {
    // prepare new video-tags-tracks-####.json files
    const tagsTracksSlices = context.concerns.VideoTagsTracksFiles.createSlices({
      sliceDurSec: TAG_TRACK_SLICE_DUR_SEC,
      offeringDurSec,
      tagTracks
    })

    // prepare new metadata
    const tagsTracksListMeta = VideoTagsMetadata.forFileList(Object.keys(tagsTracksSlices))

    console.log('\n\n=======================')
    console.log(JSON.stringify(tagsTracksListMeta,null,2))
    console.log('\n\n=======================')

    // replace /video_tags metadata
    await context.concerns.VideoTagsMetadata.replace({libraryId, tagsTracksListMeta, objectId, writeToken})
    // replace /video_tags/video-tags-tracks-####.json files
    await context.concerns.VideoTagsTracksFiles.replace({encrypt, tagsTracksSlices, libraryId, objectId, writeToken})



    // // write metadata back to draft
    // await this.concerns.Edit.writeMetadata({
    //   commitMessage: 'Set video tags',
    //   libraryId,
    //   metadata: videoTagsMeta,
    //   metadataSubtree: '/video_tags',
    //   objectId,
    //   writeToken
    // })

  }

  // instance interface
  return {
    filesExist,
    metaExists,
    replace
  }
}

module.exports = {
  blueprint,
  New,
  validateTagTracksInput
}
