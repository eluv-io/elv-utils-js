const util = require('util')

const defBasicModel = require('@eluvio/elv-js-helpers/ModelFactory/defBasicModel')
const defNonEmptyArrModel = require('@eluvio/elv-js-helpers/ModelFactory/defNonEmptyArrModel')
const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')
const defSealedObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defSealedObjModel')
const mergeRight = require('@eluvio/elv-js-helpers/Functional/mergeRight')
const NonNegativeIntModel = require('@eluvio/elv-js-helpers/Model/NonNegativeIntModel')
const NonNegativeNumModel = require('@eluvio/elv-js-helpers/Model/NonNegativeNumModel')
const PositiveIntModel = require('@eluvio/elv-js-helpers/Model/PositiveIntModel')
const PositiveNumModel = require('@eluvio/elv-js-helpers/Model/PositiveNumModel')
const reduce = require('@eluvio/elv-js-helpers/Functional/reduce')

const HDRInfoModel = require('./HDRInfoModel')

const HDRFieldsOptionalModel = defBasicModel('HDRFieldsOptional', [null, undefined, HDRInfoModel])

const MediaContainerFormatModel = defSealedObjModel('MediaContainerFormat', {
  duration: NonNegativeNumModel,
  filename: String,
  format_name: String,
  start_time: 0
})

const MEDIA_STREAM_TYPE_AUDIO = 'StreamAudio'
const MEDIA_STREAM_TYPE_DATA = 'StreamData'
const MEDIA_STREAM_TYPE_IMAGE = 'StreamImage'
const MEDIA_STREAM_TYPE_SUBTITLE = 'StreamSubtitle'
const MEDIA_STREAM_TYPE_VIDEO = 'StreamVideo'

const MediaStreamTypeModel = defBasicModel('MediaStreamType', [
  MEDIA_STREAM_TYPE_AUDIO,
  MEDIA_STREAM_TYPE_DATA,
  MEDIA_STREAM_TYPE_IMAGE,
  MEDIA_STREAM_TYPE_SUBTITLE,
  MEDIA_STREAM_TYPE_VIDEO
])

const MS_STREAM_COMMON_FIELDS = ({
  codec_name: String,
  language: String,
  side_data_list: [null, Array, undefined],
  tags: [null, Object, undefined]
})

const MS_STREAM_DIMENSION_FIELDS = ({
  display_aspect_ratio: String,
  height: PositiveIntModel,
  sample_aspect_ratio: String,
  width: PositiveIntModel
})

const MS_STREAM_DURATION_FIELDS = ({
  bit_rate: NonNegativeIntModel,
  duration: PositiveNumModel,
  duration_ts: PositiveIntModel,
  frame_count: NonNegativeIntModel, // jpeg2000 master returns frame count zero - so can't use PositiveIntModel,
  max_bit_rate: NonNegativeIntModel,
  start_pts: NonNegativeIntModel,
  start_time: NonNegativeNumModel,
  time_base: String
})

// some files contain data stream with zero duration
const MS_DATA_STREAM_DURATION_FIELDS = ({
  bit_rate: NonNegativeIntModel,
  duration: NonNegativeNumModel,
  duration_ts: NonNegativeIntModel,
  frame_count: NonNegativeIntModel,
  max_bit_rate: NonNegativeIntModel,
  start_pts: NonNegativeIntModel,
  start_time: NonNegativeNumModel,
  time_base: String
})

const MS_STREAM_AUDIO_FIELDS = reduce(
  mergeRight,
  {},
  [
    MS_STREAM_COMMON_FIELDS,
    MS_STREAM_DURATION_FIELDS,
    {
      channel_layout: String,
      channels: PositiveIntModel,
      sample_rate: PositiveIntModel,
      type: MEDIA_STREAM_TYPE_AUDIO
    }
  ]
)

const MediaStreamAudioModel = defSealedObjModel(
  'MediaStreamAudio',
  MS_STREAM_AUDIO_FIELDS
)

const MS_STREAM_DATA_FIELDS = reduce(
  mergeRight,
  {},
  [
    MS_STREAM_COMMON_FIELDS,
    MS_DATA_STREAM_DURATION_FIELDS,
    {
      type: MEDIA_STREAM_TYPE_DATA
    }
  ]
)

const MediaStreamDataModel = defSealedObjModel(
  'MediaStreamData',
  MS_STREAM_DATA_FIELDS
)

const MS_STREAM_IMAGE_FIELDS = reduce(
  mergeRight,
  {},
  [
    MS_STREAM_COMMON_FIELDS,
    MS_STREAM_DIMENSION_FIELDS,
    {
      type: MEDIA_STREAM_TYPE_IMAGE
    }
  ]
)

const MediaStreamImageModel = defSealedObjModel(
  'MediaStreamImage',
  MS_STREAM_IMAGE_FIELDS
)

const MS_STREAM_SUBTITLE_FIELDS = reduce(
  mergeRight,
  {},
  [
    MS_STREAM_COMMON_FIELDS,
    {
      type: MEDIA_STREAM_TYPE_SUBTITLE
    }
  ]
)

const MediaStreamSubtitleModel = defSealedObjModel(
  'MediaStreamSubtitle',
  MS_STREAM_SUBTITLE_FIELDS
)

const MS_STREAM_VIDEO_FIELDS = reduce(
  mergeRight,
  {},
  [
    MS_STREAM_COMMON_FIELDS,
    MS_STREAM_DIMENSION_FIELDS,
    MS_STREAM_DURATION_FIELDS,
    {
      field_order: String,
      frame_rate: String,
      hdr: HDRFieldsOptionalModel,
      type: MEDIA_STREAM_TYPE_VIDEO
    }
  ]
)

const MediaStreamVideoModel = defSealedObjModel(
  'MediaStreamVideo',
  MS_STREAM_VIDEO_FIELDS
)

const MediaStreamModel = defObjectModel('MediaStream', MS_STREAM_COMMON_FIELDS).assert(function checkSourceStream(i) {
  if (util.types.isProxy(i)) return true
  switch (i.type) {
    case MEDIA_STREAM_TYPE_AUDIO:
      return MediaStreamAudioModel.test(i, MediaStreamModel.errorCollector)
    case MEDIA_STREAM_TYPE_DATA:
      return MediaStreamDataModel.test(i, MediaStreamModel.errorCollector)
    case MEDIA_STREAM_TYPE_IMAGE:
      return MediaStreamImageModel.test(i, MediaStreamModel.errorCollector)
    case MEDIA_STREAM_TYPE_SUBTITLE:
      return MediaStreamSubtitleModel.test(i, MediaStreamModel.errorCollector)
    case MEDIA_STREAM_TYPE_VIDEO:
      return MediaStreamVideoModel.test(i, MediaStreamModel.errorCollector)
    default:
      throw Error(`Unrecognized stream type: ${i.type}`)
  }
})

const MediaStreamArrayModel = defNonEmptyArrModel('MediaStreamArray', MediaStreamModel)

const MediaSourceModel = defSealedObjModel('MediaSource', {
  container_format: MediaContainerFormatModel,
  streams: MediaStreamArrayModel
})

module.exports = {
  MediaContainerFormatModel,
  MediaSourceModel,
  MediaStreamArrayModel,
  MediaStreamAudioModel,
  MediaStreamDataModel,
  MediaStreamImageModel,
  MediaStreamModel,
  MediaStreamSubtitleModel,
  MediaStreamTypeModel,
  MediaStreamVideoModel
}
