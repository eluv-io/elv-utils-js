// Create new master from specified file(s)
'use strict'
const mergeRight = require('@eluvio/elv-js-helpers/Functional/mergeRight')

const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const V = require('./lib/models/Variant')
const VariantModel = V.VariantModel

const ArgCommitMsg = require('./lib/concerns/args/ArgCommitMsg')
const ArgLibraryId = require('./lib/concerns/args/ArgLibraryId')
const ArgMetadata = require('./lib/concerns/ArgMetadata')
const ArgNoFinalize = require('./lib/concerns/args/ArgNoFinalize')
const ArgStoreClear = require('./lib/concerns/args/ArgStoreClear')
const ArgType = require('./lib/concerns/ArgType')
const AssetMetadata = require('./lib/concerns/kits/AssetMetadata.js')
const Client = require('./lib/concerns/Client')
const CloudFile = require('./lib/concerns/kits/CloudFile')
const ContentType = require('./lib/concerns/ContentType')
const Finalize = require('./lib/concerns/libs/Finalize.js')
const ProcessJSON = require('./lib/concerns/libs/ProcessJSON.js')
const LocalFile = require('./lib/concerns/kits/LocalFile')

class MasterCreate extends Utility {
  static blueprint() {
    return {
      concerns: [
        Client,
        CloudFile,
        ContentType,
        ProcessJSON,
        LocalFile,
        ArgCommitMsg,
        ArgLibraryId,
        AssetMetadata,
        ArgMetadata,
        ArgNoFinalize,
        ArgStoreClear,
        ArgType,
        Finalize
      ],
      options: [
        ModOpt('libraryId', {
          alias: ['masterLib', 'master-lib'],
          demand: true,
          forX: 'new master'
        }),
        ModOpt('type', {
          alias: ['masterType', 'master-type'],
          demand: true,
          forX: 'new master'
        }),
        ModOpt('metadata', {ofX: 'master object'}),
        ModOpt('title', {demand: true}),
        ModOpt('files', {forX: 'for new master'}),
        ModOpt('storeClear', {
          X: 'for uploaded/copied files',
          type: 'boolean'
        }),
        NewOpt('streams', {
          descTemplate: 'JSON string or path to JSON file containing stream specifications for variant in new master',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const J = this.concerns.ProcessJSON

    const {
      storeClear,
      s3Copy,
      s3Reference
    } = this.args

    const addFromCloud = s3Reference || s3Copy

    let access
    if(addFromCloud) {
      access = this.concerns.CloudFile.credentialSet()
    }

    const metadataFromArg = this.concerns.ArgMetadata.asObject() || {}

    let streams
    if(this.args.streams) {
      streams = J.parseStringOrFile({strOrPath: this.args.streams})
      const variant = {streams}
      // validate
      VariantModel(variant)
    }

    const newPublicMetadata = this.concerns.AssetMetadata.publicMetadata({
      oldPublicMetadata: metadataFromArg.public,
      backupNameSuffix: 'MASTER'
    })
    const metadata = mergeRight(metadataFromArg, {public: newPublicMetadata})

    let fileHandles = []
    const fileInfo = access
      ? this.concerns.CloudFile.fileInfo()
      : this.concerns.LocalFile.fileInfo(fileHandles)

    // delay getting elvClient until this point so script exits faster
    // if there is a validation error above
    const client = await this.concerns.Client.get()

    const type = await this.concerns.ArgType.typVersionHash()
    const {libraryId} = this.args

    const createResponse = await client.CreateProductionMaster({
      libraryId,
      type,
      name: metadata.public.name,
      description: 'Master for ' + metadata.public.asset_metadata.title,
      metadata,
      fileInfo,
      encrypt: !storeClear,
      access,
      copy: s3Copy && !s3Reference,
      callback: (access ? this.concerns.CloudFile : this.concerns.LocalFile).callback
    })

    const {errors, warnings, id} = createResponse
    // Log object id immediately, in case of error later in script
    // Don't log hash yet, it will change if --streams was provided (or any other revision to object is needed)
    logger.data('object_id', id)

    let hash = createResponse.hash

    // Close file handles (if any)
    this.concerns.LocalFile.closeFileHandles(fileHandles)

    await this.concerns.Finalize.waitForPublish({
      latestHash: hash,
      objectId: id,
      libraryId
    })

    logger.errorsAndWarnings({errors, warnings})

    await client.SetVisibility({id, visibility: 0})

    // was stream info supplied at command line?
    if(streams) {
      // replace variant stream info
      const {write_token} = await client.EditContentObject(
        {
          libraryId,
          objectId: id
        }
      )

      await client.ReplaceMetadata({
        libraryId,
        objectId: id,
        writeToken: write_token,
        metadata: streams,
        metadataSubtree: '/production_master/variants/default/streams'
      })

      const finalizeResponse = await client.FinalizeContentObject({
        libraryId,
        objectId: id,
        writeToken: write_token
      })
      hash = finalizeResponse.hash
    }

    logger.logList(
      '',
      'Master object created:',
      `  Object ID: ${id}`,
      `  Version Hash: ${hash}`,
      ''
    )

    logger.data('objectId', hash)
    logger.data('versionHash', hash)
    // preserve backwards compatibility
    logger.data('version_hash', hash)

    if(!streams) {
      // Check if resulting variant has an audio and a video stream
      const streamsFromServer = (await client.ContentObjectMetadata({
        libraryId,
        objectId: id,
        versionHash: hash,
        metadataSubtree: '/production_master/variants/default/streams'
      }))
      if(!Object.keys(streamsFromServer).includes('audio')) {
        logger.log()
        logger.warn('WARNING: no audio stream found')
        logger.log()
        logger.data('audio_found', false)
      } else {
        logger.data('audio_found', true)
      }

      if(!Object.keys(streamsFromServer).includes('video')) {
        logger.log()
        logger.warn('WARNING: no video stream found')
        logger.log()
        logger.data('video_found', false)
      } else {
        logger.data('video_found', true)
      }
      logger.data('variant_streams', streamsFromServer)
    }

    // add info on source files to data if --json selected
    if(this.args.json) {
      // Get source info
      const sources = (await client.ContentObjectMetadata({
        libraryId,
        objectId: id,
        versionHash: hash,
        metadataSubtree: '/production_master/sources'
      }))
      logger.data('media_files', sources)
    }
  }

  header() {
    return 'Create master'
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MasterCreate)
} else {
  module.exports = MasterCreate
}
