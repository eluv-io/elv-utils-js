const {
  ArrayModel,
  BasicModel,
  NonNegativeNumber,
  ObjectModel,
  PositiveInteger,
  PositiveNumber,
  NonNegativeInteger
} = require('./Models')

const HDRFieldsModel = ObjectModel({
  master_display: String,
  max_cll: String
})

const MediaContainerFormatModel = ObjectModel({
  duration: NonNegativeNumber,
  filename: String,
  format_name: String,
  start_time: 0
})


const MEDIA_STREAM_TYPE_AUDIO = 'StreamAudio'
const MEDIA_STREAM_TYPE_DATA = 'StreamData'
const MEDIA_STREAM_TYPE_IMAGE = 'StreamImage'
const MEDIA_STREAM_TYPE_SUBTITLE = 'StreamSubtitle'
const MEDIA_STREAM_TYPE_VIDEO = 'StreamVideo'

const MediaStreamTypeModel = BasicModel([
  MEDIA_STREAM_TYPE_AUDIO,
  MEDIA_STREAM_TYPE_DATA,
  MEDIA_STREAM_TYPE_IMAGE,
  MEDIA_STREAM_TYPE_SUBTITLE,
  MEDIA_STREAM_TYPE_VIDEO
])

// common fields, dimension fields, duration fields
const MediaStreamCommonFieldsModel = ObjectModel({
  codec_name: String,
  language: String,
  side_data_list: [null, Array],
  tags: [null, Object]
})

const MediaStreamDimensionFieldsModel = ObjectModel({
  display_aspect_ratio: String,
  height: PositiveInteger,
  sample_aspect_ratio: String,
  width: PositiveInteger
})

const MediaStreamDurationFieldsModel = ObjectModel({
  bit_rate: PositiveInteger,
  duration: PositiveNumber,
  duration_ts: PositiveInteger,
  frame_count: PositiveInteger,
  max_bit_rate: NonNegativeInteger,
  start_pts: NonNegativeInteger,
  start_time: NonNegativeNumber,
  time_base: String
})

const MediaStreamAudioModel = MediaStreamCommonFieldsModel.extend(
  MediaStreamDurationFieldsModel,
  {
    channel_layout: String,
    channels: PositiveInteger,
    sample_rate: PositiveInteger,
    type: MEDIA_STREAM_TYPE_AUDIO
  }
).as('MediaStreamAudio')

const MediaStreamDataModel = MediaStreamCommonFieldsModel.extend(
  MediaStreamDurationFieldsModel,
  {
    type: MEDIA_STREAM_TYPE_DATA
  }
).as('MediaStreamData')

const MediaStreamImageModel = MediaStreamCommonFieldsModel.extend(
  MediaStreamDimensionFieldsModel,
  {
    type: MEDIA_STREAM_TYPE_IMAGE
  }
).as('MediaStreamImage')

const MediaStreamSubtitleModel = MediaStreamCommonFieldsModel.extend(
  {
    type: MEDIA_STREAM_TYPE_SUBTITLE
  }
).as('MediaStreamSubtitle')

const MediaStreamVideoModel = MediaStreamCommonFieldsModel.extend(
  MediaStreamDimensionFieldsModel,
  MediaStreamDurationFieldsModel,
  {
    field_order: String,
    frame_rate: String,
    hdr: [HDRFieldsModel],
    type: MEDIA_STREAM_TYPE_VIDEO
  }
).as('MediaStreamVideo')

const MediaStreamModel = ObjectModel({}).extend().assert(i => {
  switch (i.type) {
    case MEDIA_STREAM_TYPE_AUDIO:
      MediaStreamAudioModel(i)
      return true
    case MEDIA_STREAM_TYPE_DATA:
      MediaStreamDataModel(i)
      return true
    case MEDIA_STREAM_TYPE_IMAGE:
      MediaStreamImageModel(i)
      return true
    case MEDIA_STREAM_TYPE_SUBTITLE:
      MediaStreamSubtitleModel(i)
      return true
    case MEDIA_STREAM_TYPE_VIDEO:
      MediaStreamVideoModel(i)
      return true
    default:
      throw Error(`Unrecognized stream type: ${i.type}`)
  }
})

const MediaStreamArrayModel = ArrayModel(MediaStreamModel)

const MediaSourceModel = ObjectModel({
  container_format: MediaContainerFormatModel,
  streams: MediaStreamArrayModel
})

module.exports = {
  HDRFieldsModel,
  MediaContainerFormatModel,
  MediaSourceModel,
  MediaStreamArrayModel,
  MediaStreamCommonFieldsModel,
  MediaStreamDimensionFieldsModel,
  MediaStreamDurationFieldsModel,
  MediaStreamAudioModel,
  MediaStreamDataModel,
  MediaStreamImageModel,
  MediaStreamModel,
  MediaStreamSubtitleModel,
  MediaStreamTypeModel,
  MediaStreamVideoModel
}
