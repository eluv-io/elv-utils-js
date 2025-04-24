// Get mezzanine job status and optionally finalize
'use strict'

const {NewOpt, ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const ArgIgnoreBitrateLimit = require('./lib/concerns/args/ArgIgnoreBitrateLimit')
const ArgNoWaitPublish = require('./lib/concerns/args/ArgNoWaitPublish')
const ArgObjectId = require('./lib/concerns/ArgObjectId')
const Finalize = require('./lib/concerns/libs/Finalize.js')
const Logger = require('./lib/concerns/kits/Logger.js')
const LRO = require('./lib/concerns/libs/LRO.js')

class MezJobStatus extends Utility {
  static blueprint() {
    return {
      concerns: [
        ArgIgnoreBitrateLimit,
        ArgNoWaitPublish,
        ArgObjectId,
        Client,
        Finalize,
        Logger,
        LRO
      ],
      options: [
        ModOpt('objectId', {ofX: 'mezzanine', demand: true}),
        ModOpt('libraryId', {forX: 'mezzanine'}),
        NewOpt('finalize', {
          descTemplate: 'If specified, will finalize the mezzanine if all jobs are completed',
          type: 'boolean'
        }),
        NewOpt('force', {
          descTemplate: 'When finalizing, proceed even if warning raised',
          implies: 'finalize',
          type: 'boolean'
        }),
        ModOpt('noWaitPublish', {implies: 'finalize'})
      ]
    }
  }

  async body() {
    const client = await this.concerns.Client.get()
    const logger = this.logger
    const lro = this.concerns.LRO

    const {
      finalize,
      force,
      ignoreBitrateLimit,
      libraryId,
      noWaitPublish,
      objectId,
    } = await this.concerns.ArgObjectId.argsProc()
    //const offeringKey = this.args.offeringKey;

    let statusReport
    try {
      statusReport = await lro.status({libraryId, objectId})
    } catch(e) {
      if(finalize && force && e.message === 'Received no job status information from server - object already finalized?') {
        logger.warn(e.message)
        logger.warn('--force specified, will attempt to finalize anyway')
      } else {
        throw e
      }
    }

    let status_summary

    if(statusReport) {
      logger.logList(
        JSON.stringify(statusReport, null, 2).split('\n')
      )
      logger.data('LROs', statusReport.LROs)

      status_summary = statusReport.summary

      logger.data('status_summary', status_summary)

      if(lro.warningFound(statusReport) && !(finalize && force)) throw Error('Warnings raised for job status, exiting script!')
    }

    if(finalize) {
      const safeSummaryRunState = status_summary && status_summary.run_state
      const STATE_FINISHED = LRO.STATE_FINISHED
      if(safeSummaryRunState !== STATE_FINISHED) {
        if(force) {
          logger.warn(`Overall run state is "${safeSummaryRunState}" rather than "${STATE_FINISHED}", but --force specified, attempting finalization...`)
        } else {
          throw Error(`Error finalizing mezzanine - overall run state is "${safeSummaryRunState}" rather than "${STATE_FINISHED}"`)
        }
      } else {
        logger.log('Finalizing mezzanine...')
      }

      const finalizeResponse = await client.FinalizeABRMezzanine({libraryId, objectId, ignoreBitrateLimit})
      const latestHash = finalizeResponse.hash
      logger.logList(
        '',
        'ABR mezzanine object finalized:',
        `  Object ID: ${objectId}`,
        `  Version Hash: ${latestHash}`,
        ''
      )
      logger.data('version_hash', latestHash)
      logger.data('finalized', true)

      if (!noWaitPublish) await this.concerns.Finalize.waitForPublish({latestHash, libraryId, objectId})
    }
  }

  header() {
    return 'Get status for mezzanine job(s)'
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MezJobStatus)
} else {
  module.exports = MezJobStatus
}
