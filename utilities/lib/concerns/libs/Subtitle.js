// code related to working with subtitles/captions
const clone = require('@eluvio/elv-js-helpers/Functional/clone')

const Logger = require('../kits/Logger')
const Offering = require('./Offering')

const blueprint = {
  name: 'Subtitle',
  concerns: [Logger]
}

const RE_VTT_TIMESTAMP_LINE = /^(([0-9]{2}:)?[0-9]{2}:[0-9]{2}\.[0-9]{3}) --> (([0-9]{2}:)?[0-9]{2}:[0-9]{2}\.[0-9]{3})(.*$)/
const RE_VTT_TIMESTAMP_PARTS = /(([0-9]{2}):)?([0-9]{2}):([0-9]{2}\.[0-9]{3})/

const addToOffering = ({offering, partHash, forced, isDefault, label, language, streamKey}) => {
  const offeringCopy = clone(offering)

  let subtitleRepKey = streamKey + '-vtt' // representation is VTT, append as suffix as convention

  const vidStreamKey = Offering.firstVideoStreamKey({offering: offeringCopy})

  // copy temporal info from video stream
  const vidStream = offeringCopy.media_struct.streams[vidStreamKey]
  const timeBase = vidStream.duration.time_base
  const durationRat = vidStream.duration.rat
  const durationTs = vidStream.duration.ts
  const rate = vidStream.rate

  // construct metadata for caption stream media_struct

  const mediaStructStream = {
    bit_rate: 100,
    codec_name: 'webvtt',
    codec_type: 'captions',
    default_for_media_type: isDefault,
    duration: {
      time_base: timeBase,
      ts: durationTs
    },
    label: label,
    language: language,
    optimum_seg_dur: {
      time_base: timeBase,
      ts: durationTs
    },
    rate: rate,
    sources: [
      {
        duration: {
          time_base: timeBase,
          ts: durationTs
        },
        entry_point: {
          rat: '0',
          time_base: timeBase
        },
        source: partHash,
        timeline_end: {
          rat: durationRat,
          time_base: timeBase
        },
        timeline_start: {
          rat: '0',
          time_base: timeBase
        }
      }
    ],
    start_time: {
      time_base: timeBase,
      ts: 0
    },
    time_base: timeBase
  }

  if(forced) mediaStructStream.forced = true

  // construct metadata for caption stream playout

  let playoutStream = {
    encryption_schemes: {},
    representations: {}
  }
  playoutStream.representations[subtitleRepKey] = {
    bit_rate: 100,
    media_struct_stream_key: streamKey,
    type: 'RepCaptions'
  }

  // merge into object offering metadata
  offeringCopy.media_struct.streams[streamKey] = mediaStructStream
  offeringCopy.playout.streams[streamKey] = playoutStream

  return offeringCopy
}

const adjustTimestamps = (timeShift, strOrBuffer) => {
  const contentString = strOrBuffer.toString('utf8')
  const lines = contentString.split(/\r?\n/)
  const remappedLines = lines.map(x => vttLineTimeShift(x, timeShift))
  return remappedLines.join('\n')
}

const timeStampShift = (timestamp, offset) => {
  const match = RE_VTT_TIMESTAMP_PARTS.exec(timestamp)
  const shiftedSeconds = parseInt(match[2] || 0, 10) * 3600 + parseInt(match[3], 10) * 60 + parseFloat(match[4]) + offset
  if(shiftedSeconds < 0) {
    throw new Error('timeShift resulted in negative timestamp')
  }

  const hours = Math.floor(shiftedSeconds / 3600)
  const minutes = Math.floor((shiftedSeconds % 3600) / 60)
  const seconds = Math.floor(shiftedSeconds % 60)
  const milliseconds = Math.floor((shiftedSeconds % 1) * 1000)
  return zeroPadLeft(hours, 2) + ':' + zeroPadLeft(minutes, 2) + ':' + zeroPadLeft(seconds, 2) + '.' + zeroPadLeft(milliseconds, 3)
}

const vttLineTimeShift = (line, offset) => {
  const match = RE_VTT_TIMESTAMP_LINE.exec(line)
  if(match !== null) {
    return timeStampShift(match[1], offset) + ' --> ' + timeStampShift(match[3], offset) + match[5]
  } else {
    return line
  }
}

const zeroPadLeft = (value, width) => (value + '').padStart(width, '0')

const New = () => {

  // instance interface
  return {

  }
}

module.exports = {
  addToOffering,
  blueprint,
  New,
  adjustTimestamps,
  timeStampShift,
  vttLineTimeShift
}
