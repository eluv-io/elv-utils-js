// Create thumbnails (and optionally storyboards) for video stream of offering
'use strict'

const R = require('@eluvio/ramda-fork')

const PositiveIntModel = require('@eluvio/elv-js-helpers/Model/PositiveIntModel')

const Utility = require('./lib/Utility')

const {ModOpt, NewOpt} = require('./lib/options')

const Client = require('./lib/concerns/Client')
const Edit = require('./lib/concerns/Edit')
const ExistVer = require('./lib/concerns/kits/ExistVer')
const Metadata = require('./lib/concerns/Metadata')
const ArgOfferingKey = require('./lib/concerns/args/ArgOfferingKey.js')
const ArgStreamKey = require('./lib/concerns/args/ArgStreamKey.js')

class OfferingCreateThumbnails extends Utility {
  static blueprint() {
    return {
      concerns: [
        Client, ExistVer, Metadata, Edit, ArgOfferingKey, ArgStreamKey
      ],
      options: [
        NewOpt('addStream', {
          descTemplate: 'Add thumbnail stream to media (requires --storyboards)',
          type: 'boolean',
          implies: 'storyboards'
        }),
        NewOpt('targetThumbCount', {
          demand: true,
          descTemplate: 'Number of thumbnails to try to generate (result may not be exact)',
          type: 'number',
          coerce: PositiveIntModel
        }),
        NewOpt('makeDefault', {
          descTemplate: 'Make thumbnail stream the default thumbnail stream (requires --addStream)',
          type: 'boolean',
          implies: 'addStream'
        }),
        NewOpt('storyboards', {
          descTemplate: 'Generate storyboards',
          type: 'boolean'
        }),
        ModOpt('streamKey', {
          descTemplate: 'Stream key to create thumbnails/storyboards from',
          default: 'video'
        }),
        NewOpt('thumbHeight', {
          alias: 'height',
          descTemplate: 'height in pixels of each thumbnail',
          type: 'number',
          coerce: PositiveIntModel
        }),
        NewOpt('thumbWidth', {
          alias: 'width',
          descTemplate: 'width in pixels of each thumbnail',
          type: 'number',
          coerce: PositiveIntModel
        }),
        ModOpt('versionHash', {descTemplate: 'Mez version hash to use as source'})
      ]
    }
  }

  async body() {
    const logger = this.logger

    // operations that need to wait on network access
    // ----------------------------------------------------
    const {
      addStream,
      libraryId,
      makeDefault,
      objectId,
      offeringKey,
      storyboards,
      streamKey,
      targetThumbCount,
      thumbHeight,
      thumbWidth
    } = await this.concerns.ExistVer.argsProc()

    logger.log('Retrieving existing metadata from object...')
    const metadata = await this.concerns.ExistVer.metadata()

    if (!metadata.offerings || R.isEmpty(metadata.offerings)) throw Error('no offerings found in metadata')
    if (!metadata.offerings[offeringKey] || R.isEmpty(metadata.offerings[offeringKey])) throw Error(`offering '${offeringKey}' is empty`)
    if (!metadata.offerings[offeringKey].media_struct || R.isEmpty(metadata.offerings[offeringKey].media_struct)) throw Error(`offering '${offeringKey}' has empty media struct`)
    if (!metadata.offerings[offeringKey].media_struct.streams || R.isEmpty(metadata.offerings[offeringKey].media_struct.streams)) throw Error(`offering '${offeringKey}' has empty media_struct.streams`)
    if (!metadata.offerings[offeringKey].media_struct.streams[streamKey] || R.isEmpty(metadata.offerings[offeringKey].media_struct.streams[streamKey])) throw Error(`offering '${offeringKey}' stream '${streamKey}' is empty`)
    if (metadata.offerings[offeringKey].media_struct.streams[streamKey].codec_type !== 'video') throw Error(`offering '${offeringKey}' stream '${streamKey}' is not a video stream`)

    // get write token
    const {writeToken} = await this.concerns.Edit.getWriteToken({libraryId, objectId})

    const client = await this.concerns.Client.get()

    // make bitcode call
    await client.CallBitcodeMethod({
      objectId,
      libraryId,
      method: '/media/thumbnails/create',
      writeToken,
      constant: false,
      body: {
        add_to_media_struct: addStream,
        generate_storyboards: storyboards,
        make_default_for_media_type: makeDefault,
        offering_key: offeringKey,
        playout_stream_key: streamKey,
        target_thumb_count: targetThumbCount,
        thumb_height: thumbHeight,
        thumb_width: thumbWidth
      }
    })



    // Finalize
    const newHash = await this.concerns.Edit.finalize({
      libraryId,
      objectId,
      writeToken,
      commitMessage: 'Add thumbnails/storyboards'
    })
    this.logger.data('version_hash', newHash)
    this.logger.log('New version hash: ' + newHash)
  }

  header() {
    return `Create thumbnails/storyboards for offering video stream in object ${this.args.objectId}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(OfferingCreateThumbnails)
} else {
  module.exports = OfferingCreateThumbnails
}
