// start mezzanine jobs
const R = require('@eluvio/ramda-fork')

const {seconds} = require('./lib/helpers')
const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgObjectId = require('./lib/concerns/ArgObjectId')
const Client = require('./lib/concerns/Client')
const CloudAccess = require('./lib/concerns/CloudAccess')
const FabricObject = require('./lib/concerns/libs/FabricObject')
const Finalize = require('./lib/concerns/Finalize')
const JSON = require('./lib/concerns/JSON')
const LRO =  require('./lib/concerns/LRO')

class MezJobsStart extends Utility {
  static blueprint() {
    return {
      concerns: [
        ArgObjectId,
        Client,
        CloudAccess,
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
          demand: true,
          descTemplate: 'Mezzanine object id',
        }),
        NewOpt('offeringKey', {
          default: 'default',
          descTemplate: 'Key to assign to new offering',
          type: 'string'
        }),
        NewOpt('wait', {
          descTemplate: 'Wait for mezzanine to finish transcoding, then finalize before exiting script (not recommended except for very short titles)',
          type: 'boolean'
        })
      ]
    }
  }

  async body() {
    const logger = this.logger

    let access = this.concerns.CloudAccess.credentialSet(false)

    // operations that may need to wait on network access
    // ----------------------------------------------------
    await this.concerns.ArgObjectId.argsProc()
    const {libraryId, objectId, offeringKey} = this.args

    const client = await this.concerns.Client.get()

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

    logger.data('library_id', libraryId)
    logger.data('object_id', objectId)
    logger.data('offering_key', offeringKey)
    logger.data('write_token', lroWriteToken)
    logger.data('write_node', lroNode)

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
      'ABR mezzanine jobs ended:',
      `  Object ID: ${objectId}`,
      `  Version Hash: ${latestHash}`,
      ''
    )
    logger.data('version_hash', latestHash)
    await this.concerns.Finalize.waitForPublish({
      latestHash,
      libraryId,
      objectId
    })
  }

  header() {
    return `Start Mezzanine transcoding job for offering '${this.args.offeringKey}' in Mez ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MezJobsStart)
} else {
  module.exports = MezJobsStart
}
