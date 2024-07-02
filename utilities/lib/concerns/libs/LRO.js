const isUndefined = require('@eluvio/elv-js-helpers/Boolean/isUndefined')

const enhanceLROStatus = require('@eluvio/elv-lro-status/enhanceLROStatus')
const defaultOptions = require('@eluvio/elv-lro-status/defaultOptions')

const {
  STATE_UNKNOWN,
  STATE_FINISHED,
  STATE_NOT_STARTED,
  STATE_RUNNING,
  STATE_STALLED,
  STATE_BAD_PCT,
  STATE_FAILED,
  STATE_CANCELLED_TIMEOUT,
  STATE_CANCELLED_SHUTDOWN,
  STATE_CANCELLED_USER
} = require('@eluvio/elv-lro-status/enhancedRunState')
const {
  LRO_RS_CANCELLED_SHUTDOWN,
  LRO_RS_CANCELLED_TIMEOUT,
  LRO_RS_CANCELLED_USER,
  LRO_RS_FAILED,
  LRO_RS_FINISHED,
  LRO_RS_NOT_STARTED,
  LRO_RS_RUNNING
} = require('@eluvio/elv-lro-status/lroRunState')

const Client = require('../kits/Client')
const Logger = require('../kits/Logger')
const {seconds} = require('../../helpers')

const blueprint = {
  name: 'LRO',
  concerns: [Logger, Client]
}

const New = context => {
  const logger = context.concerns.Logger

  const draftInfo = async ({libraryId, objectId}) => {
    const client = await context.concerns.Client.get()
    return await client.LRODraftInfo({
      libraryId,
      objectId
    })
  }

  const singleLroStatus = async ({objectId, libraryId, lroId, writeToken}) => {
    const client = await context.concerns.Client.get()

    logger.log('Checking that write token exists...')

    // verify that write token can be found
    try {
      await client.ContentObject({
        objectId,
        libraryId,
        writeToken
      })
    } catch(e) {
      throw Error(`Failed to find write token ${writeToken}, has draft already been finalized? (${e})`)
    }

    return await client.CallBitcodeMethod({
      objectId,
      libraryId,
      method: '/lro/status',
      writeToken,
      constant: true,
      queryParams: {lro: lroId}
    })
  }

  // for retrieving ingest LRO info
  const status = async ({libraryId, objectId}) => {
    const client = await context.concerns.Client.get()
    const statusResponse = await client.LROStatus({libraryId, objectId})

    if(isUndefined(statusResponse)) throw Error('Received no job status information from server - object already finalized?')

    const options = Object.assign(defaultOptions(), {currentTime: new Date})
    const enhanced = enhanceLROStatus(options, statusResponse)
    if(enhanced.ok) {
      return enhanced.result
    } else {
      throw Error(enhanced.errors.join('\n'))
    }
  }

  const warningFound = statusReport => Object.entries(statusReport.LROs).findIndex(
    x => Object.keys(x).includes('warning')
  ) !== -1

  const waitForCancel = async ({libraryId, objectId, lroIds, lroDetails}) => {
    logger.log('Waiting for cancel confirmation...')
    logger.log()
    let cancelFinished = false
    let lroStatus = {}
    while(!cancelFinished) {
      lroStatus = await status({libraryId, objectId})
      let allCancelled = true
      for(const lroId of lroIds){
        const runState = lroStatus.LROs[lroId].reported_run_state || lroStatus.LROs[lroId].run_state
        if(runState !== STATE_CANCELLED_USER) {
          allCancelled = false
          const lroDesc = lroDetails[lroId].desc && ` (${lroDetails[lroId].desc.split(',')[0]})` || ''
          logger.log(`    LRO ${lroId} still shows as '${runState}'${lroDesc}`)
        }
      }
      if(allCancelled) {
        logger.log(`    All LRO(s) that were requested to cancel now report run state: '${LRO_RS_CANCELLED_USER}'`)
        cancelFinished = true
      } else {
        logger.log('    Waiting 15 seconds...')
        await seconds(15)
      }
    }
  }

  return {
    draftInfo,
    singleLroStatus,
    status,
    waitForCancel,
    warningFound
  }
}

module.exports = {
  blueprint,
  New,
  LRO_RS_CANCELLED_SHUTDOWN,
  LRO_RS_CANCELLED_TIMEOUT,
  LRO_RS_CANCELLED_USER,
  LRO_RS_FAILED,
  LRO_RS_FINISHED,
  LRO_RS_NOT_STARTED,
  LRO_RS_RUNNING,
  STATE_BAD_PCT,
  STATE_CANCELLED_SHUTDOWN,
  STATE_CANCELLED_TIMEOUT,
  STATE_CANCELLED_USER,
  STATE_FAILED,
  STATE_FINISHED,
  STATE_NOT_STARTED,
  STATE_RUNNING,
  STATE_STALLED,
  STATE_UNKNOWN
}
