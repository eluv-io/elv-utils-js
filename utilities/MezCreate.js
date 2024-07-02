// Create a new mezzanine and start jobs
const R = require('@eluvio/ramda-fork')

const {seconds} = require('./lib/helpers')
const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const AssetMetadata = require('./lib/concerns/kits/AssetMetadata')
const ArgMetadata = require('./lib/concerns/args/ArgMetadata')
const ArgObjectId = require('./lib/concerns/args/ArgObjectId')
const ArgType = require('./lib/concerns/args/ArgType')
const Client = require('./lib/concerns/kits/Client')
const CloudAccess = require('./lib/concerns/kits/CloudAccess')
const ContentType = require('./lib/concerns/libs/ContentType')
const FabricObject = require('./lib/concerns/libs/FabricObject')
const Finalize = require('./lib/concerns/libs/Finalize')
const JSON = require('./lib/concerns/libs/JSON')
const LRO =  require('./lib/concerns/libs/LRO')

const chkLibraryPresent = (argv) => {
  if(!argv.existingMezId && !argv.libraryId) {
    throw Error('--libraryId must be supplied unless --existingMezId is present')
  }
  return true
}

const chkTypePresent = (argv) => {
  if(!argv.existingMezId && !argv.type) {
    throw Error('--type must be supplied unless --existingMezId is present')
  }
  return true
}

const chkTitlePresent = (argv) => {
  if(!argv.existingMezId && !argv.title) {
    throw Error('--title must be supplied unless --existingMezId is present')
  }
  return true
}

class MezCreate extends Utility {
  static blueprint() {
    return {
      concerns: [
        AssetMetadata,
        ArgMetadata,
        ArgObjectId,
        ArgType,
        Client,
        CloudAccess,
        ContentType,
        FabricObject,
        Finalize,
        JSON,
        LRO
      ],
      options: [
        ModOpt('libraryId', {
          alias: ['mezLib', 'mez-lib'],
          forX: 'mezzanine'
        }),
        ModOpt('objectId', {
          alias: ['existingMezId','existing-mez-id'],
          demand: false,
          descTemplate: 'Create the offering in existing mezzanine object with specified ID',
        }),
        ModOpt('type', {
          alias: ['mezType','mez-type'],
          forX: 'mezzanine'
        }),
        ModOpt('metadata', {ofX: 'mezzanine object'}),
        ModOpt('name', {ofX: 'mezzanine object (set to title + \' MEZ\' if not supplied and --existingMezId and --metadata not specified)'}),
        NewOpt('masterHash', {
          demand: true,
          descTemplate: 'Version hash of the master object',
          type: 'string'
        }),
        NewOpt('streamKeys', {
          descTemplate: 'If supplied, only the specified stream(s) will be processed',
          string: true,
          type: 'array'
        }),
        NewOpt('keepOtherStreams', {
          descTemplate: 'When offering already exists, keep pre-existing streams (other than the ones being transcoded)',
          implies: 'existingMezId',
          type: 'boolean'
        }),
        NewOpt('offeringKey', {
          default: 'default',
          descTemplate: 'Key to assign to new offering',
          type: 'string'
        }),
        NewOpt('variantKey', {
          default: 'default',
          descTemplate: 'Variant to use from production master',
          type: 'string'
        }),
        NewOpt('wait', {
          descTemplate: 'Wait for mezzanine to finish transcoding, then finalize before exiting script (not recommended except for very short titles)',
          type: 'boolean'
        }),
        NewOpt('addlOfferingSpecs', {
          descTemplate: 'Additional offerings to create via patching - JSON string (or file path if prefixed with \'@\')',
          implies: 'abrProfile',
          type: 'string'
        }),
        NewOpt('abrProfile', {
          descTemplate: 'Path to JSON file containing ABR profile with transcoding parameters and resolution ladders (if omitted, will be read from library metadata)',
          normalize: true,
          type: 'string'
        })
      ],
      checksMap: {chkTypePresent, chkTitlePresent, chkLibraryPresent}
    }
  }

  async body() {
    const logger = this.logger

    const {
      addlOfferingSpecs,
      existingMezId,
      keepOtherStreams,
      masterHash,
      offeringKey,
      streamKeys
    } = this.args

    // do steps that don't require network access first
    // ----------------------------------------------------
    const abrProfile = this.args.abrProfile
      ? this.concerns.JSON.parseFile({path: this.args.abrProfile})
      : undefined

    let addlOffSpecs
    if(addlOfferingSpecs) {
      addlOffSpecs = this.concerns.JSON.parseStringOrFile({strOrPath: addlOfferingSpecs})
    }

    const metadataFromArg =  this.concerns.ArgMetadata.asObject() || {}

    let access = this.concerns.CloudAccess.credentialSet(false)

    // operations that may need to wait on network access
    // ----------------------------------------------------
    if(existingMezId) await this.concerns.ArgObjectId.argsProc()
    const {libraryId} = this.args

    const client = await this.concerns.Client.get()
    let existingPublicMetadata = {}
    if(existingMezId) {
      logger.log(`Retrieving metadata from existing mezzanine object ${existingMezId}...`)
      existingPublicMetadata = (await this.concerns.FabricObject.metadata({
        libraryId,
        objectId: existingMezId,
        subtree: 'public'
      })) || {}
    }

    if(!existingPublicMetadata.asset_metadata) existingPublicMetadata.asset_metadata = {}

    const mergedExistingAndArgMetadata = R.mergeDeepRight(
      {public: existingPublicMetadata},
      metadataFromArg
    )

    const newPublicMetadata = this.concerns.AssetMetadata.publicMetadata({
      oldPublicMetadata: mergedExistingAndArgMetadata.public,
      backupNameSuffix: 'MEZ'
    })

    const metadata = R.mergeDeepRight(
      metadataFromArg,
      {public: newPublicMetadata}
    )

    const type = (existingMezId && !this.args.type)
      ? await this.concerns.ContentType.forItem({libraryId, objectId: existingMezId})
      : await this.concerns.ArgType.typVersionHash()

    if(existingMezId) {
      logger.log('Updating existing mezzanine object...')
    } else {
      logger.log('Creating new mezzanine object...')
    }

    const createResponse = await client.CreateABRMezzanine({
      name: metadata.public.name,
      libraryId,
      objectId: existingMezId,
      type,
      masterVersionHash: masterHash,
      variant: this.args.variantKey,
      offeringKey,
      metadata,
      abrProfile,
      addlOfferingSpecs: addlOffSpecs,
      keepOtherStreams,
      streamKeys
    })

    logger.errorsAndWarnings(createResponse)

    const objectId = createResponse.id

    logger.log('Starting Mezzanine Job(s)')

    const startResponse = await client.StartABRMezzanineJobs({
      libraryId,
      objectId,
      offeringKey,
      access
    })

    logger.errorsAndWarnings(startResponse)

    const lroWriteToken = R.path(['lro_draft', 'write_token'], startResponse)
    const lroNode = R.path(['lro_draft', 'node'], startResponse)

    logger.data('libraryId', libraryId)
    logger.data('objectId', objectId)
    logger.data('offeringKey', offeringKey)
    logger.data('writeToken', lroWriteToken)
    logger.data('writeNode', lroNode)

    logger.logList(
      '',
      `Library ID: ${libraryId}`,
      `Object ID: ${objectId}`,
      `Offering: ${offeringKey}`,
      `Write Token: ${lroWriteToken}`,
      `Write Node: ${lroNode}`,
      ''
    )

    if(!this.args.wait) return

    logger.log('Progress:')

    const lro = this.concerns.LRO
    let done = false
    let lastStatus
    while(!done) {
      const statusReport = await lro.status({libraryId, objectId})
      const statusSummary =  statusReport.summary
      lastStatus = statusSummary.run_state
      if(lastStatus !== LRO.STATE_RUNNING) done = true
      logger.log(`run_state: ${lastStatus}`)
      const eta = statusSummary.estimated_time_left_h_m_s
      if(eta) logger.log(`estimated time left: ${eta}`)
      await seconds(15)
    }

    const finalizeAbrResponse = await client.FinalizeABRMezzanine({
      libraryId,
      objectId,
      offeringKey
    })
    const latestHash = finalizeAbrResponse.hash

    logger.errorsAndWarnings(finalizeAbrResponse)
    logger.logList(
      '',
      'ABR mezzanine object created:',
      `  Object ID: ${objectId}`,
      `  Version Hash: ${latestHash}`,
      ''
    )
    logger.data('versionHash', latestHash)
    await this.concerns.Finalize.waitForPublish({
      latestHash,
      libraryId,
      objectId
    })
  }

  header() {
    return `Create Mezzanine offering '${this.args.offeringKey}' from Variant '${this.args.variantKey}' in Master version ${this.args.masterHash}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MezCreate)
} else {
  module.exports = MezCreate
}
