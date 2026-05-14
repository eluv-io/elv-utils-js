// For every object in a specified library, modifies the 'broadcast' offering:
//   1. Sets image_watermark to null
//   2. Replaces /playout/streams/video/representations with a single
//      representation whose bit_rate, width, and height are read from
//      /offerings/broadcast/media_struct/streams/video/, preserving each
//      object's existing transcode_id.

const { ModOpt, NewOpt } = require('./lib/options')
const Utility = require('./lib/Utility')
const ArgLibraryId = require('./lib/concerns/ArgLibraryId')
const Metadata = require('./lib/concerns/Metadata')

const TARGET_OFFERING = 'broadcast'

const buildRepresentation = ({ transcodeId, bitRate, width, height }) => {
  const repKey = `videovideo_${width}x${height}_h264@${bitRate}`
  return {
    [repKey]: {
      bit_rate: bitRate,
      codec: 'h264',
      codec_desc: '',
      height,
      media_struct_stream_key: 'video',
      transcode_id: transcodeId,
      transcode_matches_rep: true,
      type: 'RepVideo',
      width
    }
  }
}

class WPABoradcastOfferingChange extends Utility {
  static blueprint() {
    return {
      concerns: [ArgLibraryId, Metadata],
      options: [
        ModOpt('libraryId', { demand: true }),
        NewOpt('objectId', {
          descTemplate: 'Process a single object ID instead of the entire library',
          type: 'string'
        }),
      ]
    }
  }

  header() {
    return `Modify '${TARGET_OFFERING}' offering for all objects in library ${this.args.libraryId}`
  }

  async body() {
    const { libraryId } = this.args

    const objectList = this.args.objectId
      ? [{ objectId: this.args.objectId }]
      : await this.concerns.ArgLibraryId.libObjectList({
          filterOptions: { select: ['/public/name'] }
        })

    this.logger.log(`Processing ${objectList.length} object(s)\n`)

    const results = { succeeded: [], skipped: [], failed: [] }

    for (const e of objectList) {
      const objectId = e.objectId
      this.logger.log(`Processing: ${objectId}`)

      try {
        const offering = await this.concerns.Metadata.get({
          libraryId,
          objectId,
          subtree: `/offerings/${TARGET_OFFERING}`
        })

        if (!offering) {
          this.logger.warn(`  Skipped — '${TARGET_OFFERING}' offering not found`)
          results.skipped.push({ objectId, reason: `'${TARGET_OFFERING}' not found` })
          continue
        }

        // Extract transcode_id from the first existing video representation
        const existingReps = offering?.playout?.streams?.video?.representations ?? {}
        const firstRep = Object.values(existingReps)[0]

        if (!firstRep?.transcode_id) {
          this.logger.warn(`  Skipped — could not find existing transcode_id in video representations`)
          results.skipped.push({ objectId, reason: 'transcode_id not found in existing representations' })
          continue
        }

        const transcodeId = firstRep.transcode_id
        this.logger.log(`  transcode_id: ${transcodeId}`)

        // Read bit_rate, width, height from media_struct/streams/video
        const mediaStructVideo = offering?.media_struct?.streams?.video
        if (!mediaStructVideo) {
          this.logger.warn(`  Skipped — media_struct/streams/video not found in '${TARGET_OFFERING}' offering`)
          results.skipped.push({ objectId, reason: 'media_struct/streams/video not found' })
          continue
        }

        const bitRate = mediaStructVideo.bit_rate
        const width   = mediaStructVideo.width
        const height  = mediaStructVideo.height

        if (!bitRate || !width || !height) {
          this.logger.warn(`  Skipped — missing bit_rate/width/height in media_struct/streams/video (got ${JSON.stringify({ bitRate, width, height })})`)
          results.skipped.push({ objectId, reason: 'incomplete media_struct video dimensions' })
          continue
        }

        this.logger.log(`  media_struct video: ${width}x${height} @ ${bitRate}bps`)

        // 1. Set image_watermark to null
        offering.image_watermark = null

        // 2. Replace video representations with single rep built from media_struct values
        offering.playout.streams.video.representations = buildRepresentation({ transcodeId, bitRate, width, height })

        const newHash = await this.concerns.Metadata.write({
          commitMessage: `Set broadcast offering: clear watermark, set 1080p@5Mbps representation`,
          libraryId,
          metadata: offering,
          objectId,
          subtree: `/offerings/${TARGET_OFFERING}`
        })

        this.logger.log(`  ✔ New version hash: ${newHash}`)
        results.succeeded.push({ objectId, newHash, transcodeId, bitRate, width, height })

      } catch (err) {
        this.logger.error(`  ✘ ${err.message}`)
        results.failed.push({ objectId, error: err.message })
      }
    }

    this.logger.log('\n=== SUMMARY ===')
    this.logger.log(`Total:     ${objectList.length}`)
    this.logger.log(`Succeeded: ${results.succeeded.length}`)
    this.logger.log(`Skipped:   ${results.skipped.length}`)
    this.logger.log(`Failed:    ${results.failed.length}`)

    this.logger.data('results', results)
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(WPABoradcastOfferingChange)
} else {
  module.exports = WPABoradcastOfferingChange
}
