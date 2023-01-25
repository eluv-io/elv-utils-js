// arguments for working with variant streams
const R = require('@eluvio/ramda-fork')

const {NewOpt} = require('../options')

const ArgStreamKey = require('./ArgStreamKey')
const ArgVariantKey = require('./ArgVariantKey')
const blueprint = {
  name: 'VariantStreamArgs',
  concerns: [ArgVariantKey, ArgStreamKey],
  options: [
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

const New = context => {

  const optsFromStream = stream => {

    const {label, language} = stream
    const isDefault = stream.default_for_media_type
    const mapping = stream.mapping_info

    const file = stream.sources[0].files_api_path
    const streamIndex = stream.sources.map(x => x.stream_index)

    const foundChannelIndexes = stream.sources.map(x => x.channel_index).filter(x=>x)
    const channelIndex = R.isEmpty(foundChannelIndexes)
      ? undefined
      : foundChannelIndexes

    const foundMultipliers = stream.sources.map(x => x.multiplier).filter(x=>x)
    const multipliers = R.isEmpty(foundMultipliers)
      ? undefined
      : foundMultipliers

    return {
      channelIndex,
      file,
      label,
      language,
      isDefault,
      mapping,
      multipliers,
      streamIndex
    }
  }

  const streamFromOpts = (sources, opts) => {
    const {
      channelIndex,
      file,
      label,
      language,
      isDefault,
      mapping,
      multipliers,
      streamIndex
    } = opts

    if(!sources[file]) throw Error(`Source '${file}' not found in master. If the file exists in the object, run utilities/MasterUpdateSources.js first.`)

    const result = {
      default_for_media_type: isDefault,
      label,
      language,
      mapping_info: mapping,
      sources: []
    }

    const source = sources[file]
    result.type = source.streams[streamIndex[0]].type
      .replace('Stream','').toLowerCase()

    for(const [arrayIndex, sIndex] of streamIndex.entries()) {
      const streamSource = {
        channel_index: channelIndex ? channelIndex[arrayIndex]: undefined,
        files_api_path: file,
        multiplier: multipliers ? multipliers[arrayIndex] : undefined,
        stream_index: sIndex,
      }
      result.sources.push(streamSource)
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
