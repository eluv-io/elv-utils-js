const passesModelCheck = require('@eluvio/elv-js-helpers/Boolean/passesModelCheck')

const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const NonNegativeIntModel = require('@eluvio/elv-js-helpers/Model/NonNegativeIntModel')

const assertAfterCheck = require('@eluvio/elv-js-helpers/ModelAssertion/assertAfterCheck')

const defArrayModel = require('@eluvio/elv-js-helpers/ModelFactory/defArrayModel')
const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')
const defRegexMatchedStrModel = require('@eluvio/elv-js-helpers/ModelFactory/defRegexMatchedStrModel')
const defTypedKVObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defTypedKVObjModel')

const VideoMetadataTagModel = defObjectModel(
  'VideoMetadataTag',
  {
    start_time: NonNegativeIntModel,
    end_time: NonNegativeIntModel,
    text: [NonBlankStrModel, defArrayModel('ArrayOfNonBlankString', NonBlankStrModel)]
  }
).assert(
  ...assertAfterCheck(
    s => passesModelCheck(NonNegativeIntModel, s.start_time) && passesModelCheck(NonNegativeIntModel, s.end_time),
    s => s.start_time <= s.end_time,
    'start_time must be <= end_time'
  )
)

const VideoMetadataTagArrayModel = defArrayModel(
  'VideoMetadataTagArray',
  VideoMetadataTagModel
)

const VideoMetadataTagTrackModel = defObjectModel(
  'VideoMetadataTagTrack',
  {
    label: NonBlankStrModel,
    tags: VideoMetadataTagArrayModel
  }
)

const VIDEO_TAG_TRACK_KEY_REGEX = /^[a-z0-9_]+([a-z0-9_-]*[a-z0-9_]+)*$/i

const VideoTagTrackKeyModel = defRegexMatchedStrModel(
  'VideoTagTrackKey',
  VIDEO_TAG_TRACK_KEY_REGEX,
  'is not in valid format (only letters, numbers, dash and underscore are allowed, and cannot start or end with a dash)'
)

const VideoTagsInputModel = defTypedKVObjModel(
  'VideoTagsInput',
  VideoTagTrackKeyModel,
  VideoMetadataTagTrackModel
)

module.exports = {
  VIDEO_TAG_TRACK_KEY_REGEX,
  VideoMetadataTagArrayModel,
  VideoMetadataTagModel,
  VideoMetadataTagTrackModel,
  VideoTagsInputModel,
  VideoTagTrackKeyModel
}