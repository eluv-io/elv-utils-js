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
    type: 'StreamAudio'
  }
)

const MediaStreamDataModel = MediaStreamCommonFieldsModel.extend(
  MediaStreamDurationFieldsModel,
  {
    type: 'StreamData'
  }
)

const MediaStreamImageModel = MediaStreamCommonFieldsModel.extend(
  MediaStreamDimensionFieldsModel,
  {
    type: 'StreamImage'
  }
)

const MediaStreamSubtitleModel = MediaStreamCommonFieldsModel.extend(
  {
    type: 'StreamSubtitle'
  }
)

const MediaStreamVideoModel = MediaStreamCommonFieldsModel.extend(
  MediaStreamDimensionFieldsModel,
  MediaStreamDurationFieldsModel,
  {
    field_order: String,
    frame_rate: String,
    hdr: [HDRFieldsModel],
    type: 'StreamVideo'
  }
)


const MediaStreamModel = BasicModel([
  MediaStreamAudioModel,
  MediaStreamDataModel,
  MediaStreamImageModel,
  MediaStreamSubtitleModel,
  MediaStreamVideoModel
])

const MediaStreamArrayModel = ArrayModel(MediaStreamModel)

const MediaSourceModel = ObjectModel({
  container_format: MediaContainerFormatModel,
  streams: MediaStreamArrayModel
})

module.exports = {
  MediaSourceModel
}
