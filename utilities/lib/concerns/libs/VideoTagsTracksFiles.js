// code related to working with video-tags-tracks-####.json files

const isEmpty = require('@eluvio/elv-js-helpers/Boolean/isEmpty')
const matchesRegex = require('@eluvio/elv-js-helpers/Boolean/matchesRegex')

const clone = require('@eluvio/elv-js-helpers/Functional/clone')
const getProp = require('@eluvio/elv-js-helpers/Functional/getProp')
const mapObjValues = require('@eluvio/elv-js-helpers/Functional/mapObjValues')

const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const PositiveNumModel = require('@eluvio/elv-js-helpers/Model/PositiveNumModel')

const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')

const throwIfArgsBad = require('@eluvio/elv-js-helpers/Validation/throwIfArgsBad')

const {RE_VIDEO_TAGS_TRACKS_FILEPATH, VideoTagTracksInputModel} = require('../../models/VideoTagModels')

const Logger = require('../kits/Logger')
const FabricFile = require('./FabricFile')

const {minMax} = require('../../helpers')

const blueprint = {
  name: 'VideoTagsTracksFiles',
  concerns: [Logger, FabricFile]
}

const PAD_ZERO_MIN_WIDTH_4 = new Intl.NumberFormat(
  'en',
  {
    minimumIntegerDigits: 4,
    useGrouping: false,
    maximumFractionDigits: 0
  }
)

// Regexp to extract file number suffix from end of 'video-tags-tracks-####.json' filename
const FILENAME_INDEX_REGEX = /^.+-([0-9]{4,})\.json$/

// returns the numeric index from the filename suffix
const filename2Index = filename => {
  const match = filename.match(FILENAME_INDEX_REGEX)
  if (!match) throwError(`filenameIndex() - index not found in filename (${filename})`)
  return match[1]
}

// returns the filename for an index
const index2Filename = index => `video-tags-tracks-${PAD_ZERO_MIN_WIDTH_4.format(index)}.json`

const minMaxStartPerTrack = objTagTracks => (mapObjValues(
  track => tagsMinMaxStart((track.tags)),
  objTagTracks
))

const slice2fileInfoElement = ([sliceFilename, tagsTracksSlice]) => {
  const data = Buffer.from(JSON.stringify({
    metadata_tags: tagsTracksSlice,
    version: 1
  }))
  return Object({
    data,
    mime_type: 'application/json',
    path: `/video_tags/${sliceFilename}`,
    size: data.length
  })
}


const tagsMinMaxStart = arrTags => minMax(
  {getFn: getProp('start_time')},
  arrTags
)

const tracksMinMaxStart = objTagTracks => (minMax(
  {minGetFn: getProp('min'), maxGetFn: getProp('max')},
  (Object.values(minMaxStartPerTrack(objTagTracks)))
))

const New = context => {

  // add files to /video_tags subdirectory in object
  const add = async ({tagsTracksSlices, libraryId, objectId, writeToken}) => {
    // TODO: validate args

    // convert objects to strings, prepare fileInfo needed by elv-client
    const fileInfo = Object.entries(tagsTracksSlices).map(slice2fileInfoElement)

    return await context.concerns.FabricFile.add({
      encrypt: false,
      fileInfo,
      libraryId,
      objectId,
      writeToken
    })
  }

  const CREATE_SLICES_ARGSMODEL = defObjectModel(
    'sliceTagTracks()',
    {
      sliceDurSec: PositiveNumModel,
      offeringDurSec: PositiveNumModel,
      tagTracks: VideoTagTracksInputModel
    }
  )

  // returns a set of slices for a collection of tag tracks
  const createSlices = ({sliceDurSec, offeringDurSec, tagTracks}) => {
    throwIfArgsBad(
      CREATE_SLICES_ARGSMODEL,
      {
        sliceDurSec,
        offeringDurSec,
        tagTracks
      }
    )

    const SLICE_DUR_MS = sliceDurSec * 1000
    // convert tagTracks object to array of [k,v] pairs for easier manipulation
    const tagTrackPairs = Object.entries(tagTracks)

    // get min and max start_time
    const minMaxInput = tracksMinMaxStart(tagTracks)

    const offeringDurMs = offeringDurSec * 1000

    // clamp min/max to not exceed video dur
    const min = Math.min(minMaxInput.min, offeringDurMs)
    // Note below: Math.min NOT Math.max!
    const max = Math.min(minMaxInput.max, offeringDurMs)

    // calculate start and end slice indexes
    const startSliceIndex = Math.trunc(min / SLICE_DUR_MS)
    const endSliceIndex = Math.trunc(max / SLICE_DUR_MS)

    let slices = []
    for (let i = startSliceIndex; i <= endSliceIndex; i++) {
      const filename = index2Filename(i)
      const windowStart = i * SLICE_DUR_MS
      const windowEnd = Math.min(windowStart + SLICE_DUR_MS, offeringDurMs)

      const tagTracksSlice = tagTrackPairs.map(
        ([trackKey, track]) => [
          trackKey,
          Object.assign(
            clone(track),
            {
              tags: track.tags.filter(tag => tag.start_time >= windowStart && tag.start_time < windowEnd) // filter by start_time
                .map(tag => Object.assign(clone(tag), {end_time: Math.min(tag.end_time, offeringDurMs)})) // clamp end_time to not exceed offeringDurMs
            }
          )
        ]
      )

      const nonEmptyTracksSlice = tagTracksSlice.filter(
        // eslint-disable-next-line no-unused-vars
        (kvPair) => !isEmpty(kvPair[1].tags)
      )

      const sliceFileTracks = Object.fromEntries(nonEmptyTracksSlice)
      if (!isEmpty(sliceFileTracks)) slices.push([filename, sliceFileTracks])
    }

    return Object.fromEntries(slices)
  }

  // delete all files named /video_tags/video-tags-tracks-####.json from object (will also delete files with more than
  // four digits in numeric suffix)
  const del = async ({libraryId, objectId, writeToken}) => {
    const foundFiles = await list({libraryId, objectId, writeToken})
    if (foundFiles.length === 0) throwError('No video-tags-tracks-####.json files found')
    await context.concerns.FabricFile.del({
      filePaths: foundFiles.map(getProp('path')),
      libraryId,
      objectId,
      writeToken
    })
  }

  const exist = async ({libraryId, objectId, writeToken}) => {
    const foundFiles = await list({libraryId, objectId, writeToken})
    return foundFiles.length > 0
  }

  // Read /video_tags dir from object files and return recursive list of files
  // Returns array of objects {path: string, size: int, encrypted: boolean, [link_remote_path]: string}
  const list = async ({
    libraryId,
    objectId,
    versionHash,
    writeToken
  }) => {
    const allFileNames = await context.concerns.FabricFile.fileList({
      libraryId,
      objectId,
      filePath: '/video_tags',
      versionHash,
      writeToken
    })
    return allFileNames.filter(f => matchesRegex(RE_VIDEO_TAGS_TRACKS_FILEPATH, f.path))
  }

  const replace = async ({tagsTracksSlices, libraryId, objectId, writeToken}) => {
    // TODO: validate args

    if (await exist({libraryId, objectId, writeToken})) await del({libraryId, objectId, writeToken})
    return await add({libraryId, objectId, tagsTracksSlices, writeToken})
  }

  // instance interface
  return {
    add,
    createSlices,
    del,
    exist,
    list,
    replace
  }
}

module.exports = {
  blueprint,
  filename2Index,
  index2Filename,
  New
}
