// go through LROs for mezzanine's active job and cancel each
const R = require('@eluvio/ramda-fork')

const {ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const ArgNoWait = require('./lib/concerns/ArgNoWait')
const ArgObjectId = require('./lib/concerns/ArgObjectId')
const Logger = require('./lib/concerns/Logger')
const LRO = require('./lib/concerns/LRO')

class MezzanineJobStatus extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ArgObjectId, Client, LRO, ArgNoWait],
      options: [
        ModOpt('objectId', {ofX: 'mezzanine', demand: true}),
        ModOpt('libraryId', {forX: 'mezzanine'})
      ]
    }
  }

  async body() {
    const client = await this.concerns.Client.get()
    const logger = this.logger

    const {libraryId, objectId} = await this.concerns.ArgObjectId.argsProc()

    let statusReport
    statusReport = await this.concerns.LRO.status({libraryId, objectId})
    logger.data('LROs', statusReport)

    const sortedLROEntries = R.sortWith(
      [
        R.ascend(R.path([1, 'desc'])),
        R.ascend(R.path([0, 'id']))
      ],
      Object.entries(statusReport.LROs)
    )

    logger.log(`Found ${sortedLROEntries.length} transcode(s):`)

    const cancellableLROs = []
    for(const [lroKey, lro] of sortedLROEntries) {
      const runStateForInclusion = lro.reported_run_state || lro.run_state
      logger.log()
      logger.log(`  ${lro.desc}`)
      logger.log(`  LRO id: ${lroKey}`)
      logger.log(`  run state '${lro.run_state}'${lro.reported_run_state ? ` (run state reported by node: '${lro.reported_run_state}')` : ''}`)

      if([LRO.LRO_RS_RUNNING, LRO.LRO_RS_NOT_STARTED].includes(runStateForInclusion)) {
        cancellableLROs.push(lroKey)
      }

    }

    logger.log()

    if(cancellableLROs.length === 0) throw Error('No cancellable LROs found.')
    logger.log(`Found ${cancellableLROs.length} cancellable transcode(s), sending cancel request to each of the following:`)

    const lroDraftInfo = await this.concerns.LRO.mezLRODraftInfo({libraryId, objectId})

    const promises = {}
    for(const lroKey of cancellableLROs) {
      const lro = statusReport.LROs[lroKey]
      logger.log()
      logger.log(`  ${lro.desc || lroKey}:`)
      logger.log(`    run_state: '${lro.run_state}'${lro.reported_run_state ? ` (run state reported by node: '${lro.reported_run_state}')` : ''}`)

      // call method without awaiting
      promises[lroKey] = client.CallBitcodeMethod({
        objectId,
        libraryId,
        method: '/lro/stop',
        writeToken: lroDraftInfo.writeToken,
        constant: false,
        body: {lro_id: lroKey}
      })
    }

    logger.log()
    // loop and wait for metadata to show that LROs were cancelled.
    await this.context.concerns.LRO.waitForCancel({
      objectId,
      libraryId,
      lroIds: cancellableLROs,
      lroDetails: statusReport.LROs
    })
  }

  header() {
    return 'Cancel mezzanine job transcode(s)...'
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MezzanineJobStatus)
} else {
  module.exports = MezzanineJobStatus
}
