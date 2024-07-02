const isUndefined = require('@eluvio/elv-js-helpers/Boolean/isUndefined')
const passesModelCheck = require('@eluvio/elv-js-helpers/Boolean/passesModelCheck')

const resultToPOJO = require('@eluvio/elv-js-helpers/Conversion/ResultToPOJO')

const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const NonNegativeIntModel = require('@eluvio/elv-js-helpers/Model/NonNegativeIntModel')

const assertAfterCheck = require('@eluvio/elv-js-helpers/ModelAssertion/assertAfterCheck')

const defArrayModel = require('@eluvio/elv-js-helpers/ModelFactory/defArrayModel')
const defBasicModel = require('@eluvio/elv-js-helpers/ModelFactory/defBasicModel')
const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')
const defRegexMatchedStrModel = require('@eluvio/elv-js-helpers/ModelFactory/defRegexMatchedStrModel')
const defTypedKVObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defTypedKVObjModel')

const validateWithModel = require('@eluvio/elv-js-helpers/Validation/validateWithModel')

const SUMMARY_TRACK_KEY_SHOT_TAGS = 'shot_tags'

const RE_VIDEO_TAGS_TRACKS_FILEPATH = /^\/video_tags\/video-tags-tracks-([0-9]{4,})\.json$/

const TAG_TRACK_KEY_REGEX = /^[a-z0-9_]+([a-z0-9_-]*[a-z0-9_]+)*$/i

const TAG_TRACK_SLICE_DUR_SEC = 600 // 10 minutes

const CONDITIONAL_ASSERT_START_NOT_AFTER_END = [
  s => passesModelCheck(NonNegativeIntModel, s.start_time) && passesModelCheck(NonNegativeIntModel, s.end_time),
  s => s.start_time <= s.end_time,
  'start_time must be <= end_time'
]

const VideoTagModel = defObjectModel(
  'VideoTag',
  {
    start_time: NonNegativeIntModel,
    end_time: NonNegativeIntModel,
    text: [NonBlankStrModel, defArrayModel('ArrayOfNonBlankString', NonBlankStrModel)]
  }
).assert(
  ...assertAfterCheck(...CONDITIONAL_ASSERT_START_NOT_AFTER_END)
)

const VideoTagArrayModel = defArrayModel(
  'VideoTagArray',
  VideoTagModel
)

const VideoTagTrackModel = defObjectModel(
  'VideoTagTrack',
  {
    label: NonBlankStrModel,
    tags: VideoTagArrayModel
  }
)

const VideoTagTrackKeyModel = defRegexMatchedStrModel(
  'VideoTagTrackKey',
  TAG_TRACK_KEY_REGEX,
  'is not in valid format (only letters, numbers, dash and underscore are allowed, and cannot start or end with a dash)'
)

// Validate input JSON file for utilities. Track cannot have magic name 'shot_tags'.
const VideoTagTracksInputModel = defTypedKVObjModel(
  'VideoTagTracksInput',
  VideoTagTrackKeyModel,
  VideoTagTrackModel
).assert(
  x => !Object.keys(x).includes(SUMMARY_TRACK_KEY_SHOT_TAGS),
  () => `Input cannot contain a tag track with key "${SUMMARY_TRACK_KEY_SHOT_TAGS}"`
)

// Special model for the 'text' field of magic tag track 'shot_tags' which defines tags exposed to indexer for search
// and clip download purposes. Unlike a regular tag track, each shot tag's text field instead contains an object, where
// the keys are labels from other tracks and the values are arrays of tags that are being consolidated into this particular
// shot tag.
const ShotTagTextModel = defTypedKVObjModel(
  'ShotTagsText',
  NonBlankStrModel,
  VideoTagArrayModel
)

const ShotTagModel = defObjectModel(
  'ShotTag',
  {
    start_time: NonNegativeIntModel,
    end_time: NonNegativeIntModel,
    text: ShotTagTextModel
  }
).assert(
  ...assertAfterCheck(...CONDITIONAL_ASSERT_START_NOT_AFTER_END)
)

const ShotTagArrayModel = defArrayModel(
  'ShotTagArray',
  ShotTagModel
)

const ShotTagTrackModel = defObjectModel(
  'ShotTagTrack',
  {
    label: NonBlankStrModel,
    tags: ShotTagArrayModel
  }
)

// Union model needed to allow object to have values that are either normal video tag tracks, or the special shot tags track
const VideoTagsTracksFileTagTrackModel = defBasicModel('VideoTagsTracksFileTagTrack', [VideoTagTrackModel, ShotTagTrackModel])

// TODO: omit() and pick() can simplify below

const _shotTagsValid = metadataTags => isUndefined(metadataTags.shot_tags) || passesModelCheck(ShotTagTrackModel, metadataTags.shot_tags)
const _nonShotTags = metadataTags => Object.fromEntries(
  Object.entries(metadataTags)
    .filter((keyValuePair) => keyValuePair[0] !== SUMMARY_TRACK_KEY_SHOT_TAGS)
)
const _otherTagsValid = metadataTags => passesModelCheck(
  VideoTagTracksInputModel,
  _nonShotTags(metadataTags)
)

// Validate /metadata_tags in video-tags-tracks-####.json files
const VideoTagsTracksFileMetadataTagsModel = defTypedKVObjModel(
  'VideoTagsTracksFileMetadataTags',
  VideoTagTrackKeyModel,
  VideoTagsTracksFileTagTrackModel
).assert(
  _shotTagsValid,
  (checkResult, value) => {
    const validateAgain = resultToPOJO(validateWithModel(ShotTagTrackModel, value.shot_tags))
    if (validateAgain.ok) throwError('VideoTagsTracksFile shot_tags failed initial validation') // this should never happen
    return `Invalid shot_tags: ${validateAgain.errMsgs.join(', ')}`
  }
).assert(
  _otherTagsValid,
  (checkResult, value) => {
    const validateAgain = resultToPOJO(validateWithModel(VideoTagTracksInputModel, _nonShotTags(value)))
    if (validateAgain.ok) throwError('VideoTagsTracksFile tag track other than "shot_tags" failed initial validation') // this should never happen
    return `Invalid tag track: ${validateAgain.errMsgs.join(', ')}`
  }
)

// Validate video-tags-tracks-####.json files
const VideoTagsTracksFileModel = defObjectModel(
  'VideoTagsTracksFile',
  {
    metadata_tags: VideoTagsTracksFileMetadataTagsModel,
    version: 1
  }
)

module.exports = {
  RE_VIDEO_TAGS_TRACKS_FILEPATH,
  SUMMARY_TRACK_KEY_SHOT_TAGS,
  TAG_TRACK_KEY_REGEX,
  TAG_TRACK_SLICE_DUR_SEC,
  VideoTagArrayModel,
  VideoTagModel,
  VideoTagTrackKeyModel,
  VideoTagTrackModel,
  VideoTagsTracksFileMetadataTagsModel,
  VideoTagsTracksFileModel,
  VideoTagTracksInputModel
}