// arguments for working with variant streams
const R = require('@eluvio/ramda-fork')

const FractionStrModel = require('@eluvio/elv-js-helpers/Model/FractionStrModel')

const {NewOpt} = require('../options')

const ArgAlternateFor = require('./args/ArgAlternateFor')
const ArgRole = require('./args/ArgRole')
const ArgStreamKey = require('./ArgStreamKey')
const ArgVariantKey = require('./ArgVariantKey')
const throwError = require('@eluvio/elv-js-helpers/Misc/throwError.js')
const blueprint = {
  name: 'VariantStreamArgs',
  concerns: [ArgAlternateFor, ArgRole, ArgStreamKey, ArgVariantKey],
  options: [
    NewOpt('deinterlace', {
      descTemplate: 'Video deinterlace method',
      type: 'string',
      choices: ['bwdif_field', 'bwdif_frame']
    }),
    NewOpt('label', {
      descTemplate: 'Stream label to show in UI',
      type: 'string'
    }),
    NewOpt('language', {
      alias: 'lang',
      descTemplate: 'Language code for stream (ISO 639-1)',
      type: 'string'
    }),
    NewOpt('isDefault', {
      descTemplate: 'Make this stream the default for its media type',
      type: 'boolean'
    }),
    NewOpt('file', {
      descTemplate: 'File within master object to use as stream source',
      type: 'string'
    }),
    NewOpt('targetFrameRate', {
      descTemplate: 'Frame rate to use for mezzanine video stream',
      type: 'string',
      coerce: FractionStrModel
    }),
    NewOpt('targetTimebase', {
      descTemplate: 'Timebase to use for mezzanine stream',
      type: 'string',
      coerce: FractionStrModel
    }),
    NewOpt('mapping', {
      choices: [
        '2MONO_1STEREO',       // combine 2 mono audio streams into a single stereo audio stream
        '2CHANNELS_1STEREO',   // extract 2 channels from a single multichannel stream, combine into a single stereo audio stream
        '5CHANNELS_1STEREO',   // extract 5 channels from a single multichannel stream, combine into a single stereo stream (mixdown)
        '5MONO_1STEREO',       // combine 5 mono streams into a single stereo stream (mixdown)
        '6CHANNELS_1SURROUND', // extract 6 channels from a single multichannel stream, combine into a single 5.1 audio stream
        '6MONO_1SURROUND'      // combine 6 mono audio streams into a single 5.1 audio stream
      ],
      descTemplate: 'Mapping for an audio stream',
      type: 'string'
    }),
    NewOpt('channelIndex', {
      descTemplate: 'Channel(s) of stream to use from file. (Only applies to audio streams)',
      type: 'array'
    }),
    NewOpt('streamIndex', {
      descTemplate: 'Index(es) of stream(s) to use from file. (Currently only audio streams can use more than 1 stream index)',
      type: 'array'
    }),
    NewOpt('multipliers', {
      alias: 'mult',
      descTemplate: 'Audio level adjustment factor(s)',
      type: 'array'
    }),
  ]
}

const New = () => {

  const optsFromStream = stream => {

    const {label, language, role} = stream
    const alternateFor = stream.alternate_for
    const deinterlace = stream.deinterlace
    const isDefault = stream.default_for_media_type
    const mapping = stream.mapping_info

    const file = stream.sources[0].files_api_path
    const streamIndex = stream.sources.map(x => x.stream_index)
    const targetFrameRate = stream.target_frame_rate
    const targetTimebase = stream.target_timebase

    const foundChannelIndexes = stream.sources.map(x => x.channel_index).filter(x=>x)
    const channelIndex = R.isEmpty(foundChannelIndexes)
      ? undefined
      : foundChannelIndexes

    const foundMultipliers = stream.sources.map(x => x.multiplier).filter(x=>x)
    const multipliers = R.isEmpty(foundMultipliers)
      ? undefined
      : foundMultipliers

    return {
      alternateFor,
      channelIndex,
      deinterlace,
      file,
      label,
      language,
      isDefault,
      mapping,
      multipliers,
      role,
      streamIndex,
      targetFrameRate,
      targetTimebase
    }
  }

  const streamFromOpts = (sources, opts) => {
    const {
      alternateFor,
      channelIndex,
      deinterlace,
      file,
      label,
      language,
      isDefault,
      mapping,
      multipliers,
      role,
      streamIndex,
      targetFrameRate,
      targetTimebase
    } = opts

    if(!sources[file]) throw Error(`Source '${file}' not found in master. If the file exists in the object, run utilities/MasterUpdateSources.js first.`)

    const result = {
      alternate_for: alternateFor,
      default_for_media_type: isDefault,
      deinterlace,
      label,
      language,
      mapping_info: mapping,
      role,
      sources: [],
      target_frame_rate: targetFrameRate,
      target_timebase: targetTimebase
    }

    const source = sources[file]

    if(!(source.streams)) throw Error(`Source '${file}' has null or empty streams property.`)

    for(const sIndex of streamIndex) {
      if(sIndex >= source.streams.length) throwError(`The sourceIndex '${sIndex}' is invalid. (Source '${file}' has only ${source.streams.length} stream(s), and numbering starts at zero)`)
    }

    result.type = source.streams[streamIndex[0]].type
      .replace('Stream','').toLowerCase()

    for(const [streamArgNum, sIndex] of streamIndex.entries()) {
      if(channelIndex) {
        for(const [channelArgNum, cIndex] of channelIndex.entries()) {
          result.sources.push( {
            channel_index: cIndex,
            files_api_path: file,
            multiplier: multipliers ? multipliers[channelArgNum] : undefined,
            stream_index: sIndex,
          })
        }
      } else {
        result.sources.push( {
          files_api_path: file,
          multiplier: multipliers ? multipliers[streamArgNum] : undefined,
          stream_index: sIndex,
        })
      }
    }
    return result
  }

  // instance interface
  return {
    optsFromStream,
    streamFromOpts
  }
}

module.exports = {
  blueprint,
  New
}
