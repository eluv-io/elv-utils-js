// check compatibility of items in offering

const isEmpty = require('@eluvio/elv-js-helpers/Boolean/isEmpty')

const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgOfferingKey = require('./lib/concerns/args/ArgOfferingKey')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const Metadata = require('./lib/concerns/Metadata')
const throwError = require('@eluvio/elv-js-helpers/Misc/throwError.js')

const playoutStreamMediaStructStream = ({role, metadata, offeringKey, playoutStreamKey}) => {
  const playoutStream = metadata.offerings[offeringKey].playout.streams[playoutStreamKey]
  if (!playoutStream) throwError(`${role} content playout stream "${playoutStreamKey}" not set`)
  const streamReps = playoutStream.representations
  if (!streamReps) throwError(`${role} content playout stream "${playoutStreamKey}" has no representations`)
  const firstRepKey = Object.keys(streamReps)[0]
  const firstRep = streamReps[firstRepKey]
  if (!firstRep) throwError(`${role} content playout stream "${playoutStreamKey}" representation "${firstRepKey}" not set`)
  const firstRepMediaStructStreamKey = firstRep.media_struct_stream_key
  if (!firstRepMediaStructStreamKey) throwError(`${role} content playout stream "${playoutStreamKey}" representation "${firstRepKey}" does not have media_struct_stream_key set`)
  const msStream = metadata.offerings[offeringKey].media_struct.streams[firstRepMediaStructStreamKey]
  if (!msStream) throwError(`${role} content media_struct stream "${firstRepMediaStructStreamKey}" not set`)
  return msStream
}

class CompositionPrecheck extends Utility {
  static blueprint() {
    return {
      concerns: [
        ArgOfferingKey, ExistObj, Metadata
      ],
      options: [
        ModOpt('libraryId', {X: 'for main content'}),
        ModOpt('objectId', {X: 'of main content'}),
        ModOpt('offeringKey', {
          X: 'of main content',
          demand: true
        }),
        NewOpt('libraryId2',
          {
            descTemplate: 'Library ID for bumper (if omitted, assumed to be same as main content)',
            type: 'string'
          }
        ),
        NewOpt('objectId2',
          {
            demand: true,
            descTemplate: 'Object ID of bumper (should start with \'iq__\')',
            type: 'string'
          }
        ),
        NewOpt('offeringKey2', {
          default: 'default',
          demand: true,
          descTemplate: 'Offering key for bumper',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const logger = this.logger

    const {offeringKey, objectId2, offeringKey2} = this.args

    // operations that need to wait on network access
    // ----------------------------------------------------
    const {libraryId} = await this.concerns.ExistObj.argsProc()
    const libraryId2 = this.args.libraryId2 || libraryId

    // get data from main content offering
    logger.log('Retrieving metadata from main content object...')
    const mainMetadata = await this.concerns.ExistObj.metadata()
    if(!mainMetadata.offerings || isEmpty(mainMetadata.offerings)) throw Error('no offerings found in main content object metadata')
    const mainOffering = mainMetadata.offerings[offeringKey]
    if (!mainOffering) throwError(`Offering "${offeringKey}" not found in main content object metadata.`)
    const mainPlayout = mainOffering.playout
    if (!mainPlayout) throwError(`Offering "${offeringKey}" in main content object metadata does not have playout set.`)
    const mainPlayoutStreams = mainPlayout.streams
    if (!mainPlayoutStreams) throwError(`Offering "${offeringKey}" in main content object metadata has no streams in playout.`)
    const mainMediaStruct = mainOffering.media_struct
    if (!mainMediaStruct) throwError(`Main content offering "${offeringKey}" does not have media_struct set`)
    const mainMediaStreams = mainMediaStruct.streams
    if (!mainMediaStreams) throwError(`Main content offering "${offeringKey}" media_struct does not have streams set`)
    const mainPlayoutFormats = mainPlayout.playout_formats
    if (!mainPlayoutFormats) throwError(`Offering "${offeringKey}" in main content object metadata has no playout_formats in playout.`)


    // get data from bumper offering
    logger.log('Retrieving metadata from bumper content object...')
    const bumperMetadata = await this.concerns.Metadata.get(
      {
        libraryId: libraryId2,
        objectId: objectId2
      }
    )
    if(!bumperMetadata.offerings || isEmpty(bumperMetadata.offerings)) throw Error('no offerings found in bumper content object metadata')
    const bumperOffering = bumperMetadata.offerings[offeringKey2]
    if (!bumperOffering) throwError(`Offering "${offeringKey2}" not found in bumper content object metadata.`)
    const bumperPlayout = bumperOffering.playout
    if (!bumperPlayout) throwError(`Offering "${offeringKey2}" in bumper content object metadata does not have playout set.`)
    const bumperPlayoutStreams = bumperPlayout.streams
    if (!bumperPlayoutStreams) throwError(`Offering "${offeringKey2}" in bumper content object metadata has no streams in playout.`)
    const bumperMediaStruct = bumperOffering.media_struct
    if (!bumperMediaStruct) throwError(`bumper content offering "${offeringKey2}" does not have media_struct set`)
    const bumperMediaStreams = bumperMediaStruct.streams
    if (!bumperMediaStreams) throwError(`bumper content offering "${offeringKey2}" media_struct does not have streams set`)
    const bumperPlayoutFormats = bumperPlayout.playout_formats
    if (!bumperPlayoutFormats) throwError(`Offering "${offeringKey2}" in bumper content object metadata has no playout_formats in playout.`)

    const mainStreamKeys = Object.keys(mainPlayoutStreams).sort()
    const bumperStreamKeys = Object.keys(bumperPlayoutStreams).sort()

    const mainFormatKeys = Object.keys(mainPlayoutFormats).sort()
    const bumperFormatKeys = Object.keys(bumperPlayoutFormats).sort()

    let problemsFound = false
    console.log('\n----------------------------------')

    // check stream keys and representations
    mainStreamKeys.forEach(playoutStreamKey => {
      const mainMsStream = playoutStreamMediaStructStream(
        {
          role: 'Main',
          metadata:mainMetadata,
          offeringKey,
          playoutStreamKey
        }
      )
      const mainPoStream = mainPlayoutStreams[playoutStreamKey]

      const mainStreamType = mainMsStream.codec_type
      if (['audio', 'video'].includes(mainMsStream.codec_type)) {
        if (!bumperStreamKeys.includes(playoutStreamKey)) {
          console.warn(`Main content playout stream "${playoutStreamKey}" (type: ${mainMsStream.codec_type}) not found in bumper playout streams, you may need to create a silent audio file to ingest and add it as stream "${playoutStreamKey}" to bumper`)
          if (mainStreamType === 'audio') console.warn(`  To create a silent audio file to ingest into bumper, use: \n\n  ffmpeg -f lavfi -i anullsrc=channel_layout=${mainMsStream.channels === 1 ? 'mono' : mainMsStream.channels === 2 ? 'stereo' : '5.1'}:sample_rate=${mainMsStream.rate} -acodec aac -t BUMPER_DURATION_IN_SECONDS silent_${mainMsStream.channels === 1 ? 'mono' : mainMsStream.channels === 2 ? 'stereo' : 'surround'}_${mainMsStream.rate}.mp4\n`)
          problemsFound = true
        } else {

          // check that stream info matches
          const bumperMsStream = playoutStreamMediaStructStream(
            {
              role: 'Bumper',
              metadata:bumperMetadata,
              offeringKey: offeringKey2,
              playoutStreamKey
            }
          )
          const bumperPoStream = bumperPlayoutStreams[playoutStreamKey]

          if (JSON.stringify(mainPoStream.encryption_streams) !== JSON.stringify(bumperPoStream.encryption_streams)) {
            console.warn(`Playout stream "${playoutStreamKey}" in main content has different encryption_schemes than the same playout stream in bumper. (This may or may not cause problems, depending on whether you are playing a format that has DRM or not)`)
            problemsFound = true
          }

          if (mainStreamType !== bumperMsStream.codec_type) {
            console.warn(`Playout stream "${playoutStreamKey}" in main content is "${mainMsStream.codec_type}" but in bumper is "${bumperMsStream.codec_type}"`)
            problemsFound = true
          }
          if (mainStreamType === 'audio') {
            if (mainMsStream.rate !== bumperMsStream.rate) {
              console.warn(`Playout audio stream "${playoutStreamKey}" in main content has rate ${mainMsStream.rate} but in bumper is ${bumperMsStream.rate}`)
              problemsFound = true
            }
            if (mainMsStream.channels !== bumperMsStream.channels) {
              console.warn(`Playout audio stream "${playoutStreamKey}" has ${mainMsStream.channels} channels in main content has but ${bumperMsStream.channels} channels in bumper`)
              problemsFound = true
            }
          } else {
            // video
            if (mainMsStream.aspect_ratio !== bumperMsStream.aspect_ratio) {
              console.warn(`Playout video stream "${playoutStreamKey}" in main content has aspect_ratio ${mainMsStream.aspect_ratio} but in bumper is ${bumperMsStream.aspect_ratio}`)
              problemsFound = true
            }
            if (mainMsStream.rate !== bumperMsStream.rate) {
              console.warn(`Playout video stream "${playoutStreamKey}" in main content has frame rate ${mainMsStream.rate} but in bumper is ${bumperMsStream.rate}`)
              console.warn(`\n  Sample command to change frame rate and (if needed) timebase:\n\n  ffmpeg -i ORIGINAL_FILENAME -r ${mainMsStream.rate} -video_track_timescale ${mainMsStream.time_base.split('/')[1]} -vcodec libx264 -b:v 9500000 NEW_FILENAME.mp4\n`)
              problemsFound = true
            }
            if (mainMsStream.time_base !== bumperMsStream.time_base) {
              console.warn(`Playout video stream "${playoutStreamKey}" in main content has time base ${mainMsStream.time_base} but in bumper is ${bumperMsStream.time_base} (This may or may not cause an issue, depending on the player)`)
              console.warn(`\n  Sample command to change timebase and (if needed) frame rate:\n\n  ffmpeg -i ORIGINAL_FILENAME -r ${mainMsStream.rate} -video_track_timescale ${mainMsStream.time_base.split('/')[1]} -vcodec libx264 -b:v 9500000 NEW_FILENAME.mp4\n`)
              problemsFound = true
            }
          }

          // check that representations match
          const mainReps = mainPoStream.representations
          const mainRepKeys = Object.keys(mainReps)

          const bumperReps = bumperPoStream.representations
          if (!bumperReps) throwError(`Bumper playout stream ${playoutStreamKey} has no representations`)
          const bumperRepKeys = Object.keys(bumperReps)

          mainRepKeys.forEach(mainRepKey => {
            if (!bumperRepKeys.includes(mainRepKey)) {
              console.warn(`Main content playout stream "${playoutStreamKey}" has representation ${mainRepKey} that is missing in bumper`)
              problemsFound = true
            } else {
              // check that representations match
            }
          })
        }
      }
    })



    // check playout formats
    mainFormatKeys.forEach(formatKey => {
      if (!bumperFormatKeys.includes(formatKey)) {
        console.warn(`Main content offering "${offeringKey}" has playout format "${formatKey}" that is missing in bumper offering "${offeringKey2}"`)
        problemsFound = true
      }
    })

    console.log('----------------------------------\n')

    if (problemsFound) {
      console.warn('Problems were found\n')
    } else {
      console.log('No problems found\n')
    }

  }

  header() {
    return 'Check compatibility to compose offerings...'
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(CompositionPrecheck)
} else {
  module.exports = CompositionPrecheck
}
