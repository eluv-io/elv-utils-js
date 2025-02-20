// Validators used for Production Master Variants

const R = require('@eluvio/ramda-fork')

// defArrayModel
// defObjectModel
//
// defNonEmptyKVObjModel

const isNil = require('@eluvio/elv-js-helpers/Boolean/isNil')

const defBasicModel = require('@eluvio/elv-js-helpers/ModelFactory/defBasicModel')
const defNonEmptyArrModel = require('@eluvio/elv-js-helpers/ModelFactory/defNonEmptyArrModel')
const defNonEmptyTypedKVObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defNonEmptyTypedKVObjModel')
const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')
// const defTypedKVObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defTypedKVObjModel')

const FractionStrModel = require('@eluvio/elv-js-helpers/Model/FractionStrModel')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const NonNegativeIntModel = require('@eluvio/elv-js-helpers/Model/NonNegativeIntModel')
const PositiveNumModel = require('@eluvio/elv-js-helpers/Model/PositiveNumModel')

const validateWithModel = require('@eluvio/elv-js-helpers/Validation/validateWithModel')


const MIX_NOOP = '' // no mixing
const MIX_2CHANNELS_1STEREO = '2CHANNELS_1STEREO' // extract 2 channels from a single multichannel stream, combine into a single stereo audio stream
const MIX_2MONO_1STEREO = '2MONO_1STEREO' // combine 2 mono audio streams into a single stereo audio stream
const MIX_5CHANNELS_1STEREO = '5CHANNELS_1STEREO'   // extract 5 channels from a single multichannel stream, combine into a single stereo stream (mixdown)
const MIX_5MONO_1STEREO = '5MONO_1STEREO'       // combine 5 mono streams into a single stereo stream (mixdown)
const MIX_6CHANNELS_1SURROUND = '6CHANNELS_1SURROUND' // extract 6 channels from a single multichannel stream, combine into a single 5.1 audio stream
const MIX_6MONO_1SURROUND = '6MONO_1SURROUND'      // combine 6 mono audio streams into a single 5.1 audio stream

const DEINTERLACE_BWDIF_FIELD = 'bwdif_field' // Outputs one frame per 'field' (effectively doubling frame rate)
const DEINTERLACE_BWDIF_FRAME = 'bwdif_frame' // Outputs one frame per 'field' (effectively doubling frame rate)
const DEINTERLACE_NONE = '' // Outputs one frame per input frame (reduces quality)

const VALID_DEINTERLACE_METHODS = [
  DEINTERLACE_NONE,
  DEINTERLACE_BWDIF_FIELD,
  DEINTERLACE_BWDIF_FRAME
]

const DeinterlaceMethodModel = defBasicModel('MappingInfo', VALID_DEINTERLACE_METHODS)

const VALID_MAPPINGS = [
  MIX_NOOP,
  MIX_2CHANNELS_1STEREO,
  MIX_2MONO_1STEREO,
  MIX_5CHANNELS_1STEREO,
  MIX_5MONO_1STEREO,
  MIX_6CHANNELS_1SURROUND,
  MIX_6MONO_1SURROUND
]

const MappingInfoModel = defBasicModel('MappingInfo', VALID_MAPPINGS)

const TYPE_AUDIO = 'audio'
const TYPE_VIDEO = 'video'

const StreamTypeModel = defBasicModel('StreamType', [TYPE_AUDIO, TYPE_VIDEO])

const VariantStreamSourceModel = defObjectModel(
  'VariantStreamSource',
  {
    channel_index: [NonNegativeIntModel],
    files_api_path: String,
    multiplier: [PositiveNumModel],
    stream_index: NonNegativeIntModel,
  }
)

const filesApiPathAllSame = R.pipe(
  R.map(R.prop('files_api_path')),
  R.uniq,
  R.length,
  R.equals(1)
)

const alternateForAndRole = stream => isNil(stream.alternate_for) === isNil( stream.role)

const alternateForIsVideo = stream => isNil(stream.alternate_for) || stream.type === TYPE_VIDEO
const deinterlaceIsVideo = stream => isNil(stream.deinterlace) || stream.type === TYPE_VIDEO
const targetFrameRateIsVideo = stream => isNil(stream.target_frame_rate) || stream.type === TYPE_VIDEO

const channelsAllOrNone = R.pipe(
  R.map(R.pipe(R.prop('channel_index'), R.isNil)),
  R.uniq,
  R.length,
  R.equals(1)
)

const channelIndexNotNull = R.pipe(R.prop('channel_index'), R.isNil, R.not)
const sourcesWithChannelIndex = R.filter(channelIndexNotNull)

const channelsAllSameStreamIndex = R.pipe(
  sourcesWithChannelIndex, // look at only sources with channel index set
  R.map(R.prop('stream_index')),
  R.uniq,
  R.length,
  R.gt(2) // 2 is greater than number of unique stream_indexes == good
)

const VariantStreamSourceArrayModel = defNonEmptyArrModel('VariantStreamSourceArray', VariantStreamSourceModel)
  .assert(filesApiPathAllSame, 'a single output stream cannot mix sources from multiple files')
  .assert(channelsAllOrNone, 'a single output stream cannot mix sources with null and non-null channelIndexes')
  .assert(channelsAllSameStreamIndex, 'a single output stream cannot mix channels from more than one input stream')

const VariantStreamModel = defObjectModel(
  'VariantStream',
  {
    alternate_for: [NonBlankStrModel],
    default_for_media_type: [Boolean],
    deinterlace: [DeinterlaceMethodModel],
    label: [String],
    language: [String],
    mapping_info: [MappingInfoModel],
    role: [NonBlankStrModel],
    sources: VariantStreamSourceArrayModel,
    target_frame_rate: [FractionStrModel],
    target_timebase: [FractionStrModel],
    type: [StreamTypeModel] // older objects may not have a type field
  }
)
  .assert(alternateForAndRole, '\'alternate_for\' and \'role\' must both be set or both blank')
  .assert(alternateForIsVideo, 'only video streams can have \'alternate_for\' set')
  .assert(deinterlaceIsVideo, 'only video streams can have \'deinterlace\' set')
  .assert(targetFrameRateIsVideo, 'only video streams can have \'target_frame_rate\' set')

const VariantModel = defObjectModel(
  'Variant',
  {
    streams: defNonEmptyTypedKVObjModel('VariantStreams', NonBlankStrModel, VariantStreamModel)
  }
)

const CheckedVariant = validateWithModel(VariantModel)

module.exports = {
  CheckedVariant,
  MIX_2CHANNELS_1STEREO,
  MIX_2MONO_1STEREO,
  VariantStreamSourceModel,
  VariantModel,
  VariantStreamModel
}
