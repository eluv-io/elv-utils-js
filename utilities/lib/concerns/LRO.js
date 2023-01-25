const kindOf = require('kind-of')
const R = require('@eluvio/ramda-fork')

// const moment = require("moment");

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

// const {etaString} = require("../helpers");
const Client = require('./Client')
const Logger = require('./Logger')
const {seconds} = require('../helpers')

const blueprint = {
  name: 'LRO',
  concerns: [Logger, Client]
}

// amount of time allowed to elapse since last LRO update before raising 'stalled' error
// const MAX_REPORTED_DURATION_TOLERANCE = 15 * 60; // 15 minutes

// const STATE_UNKNOWN = "unknown";
// const STATE_FINISHED = "finished";
// const STATE_RUNNING = "running";
// const STATE_STALLED = "stalled";
// const STATE_BAD_PCT = "bad_percentage";
// const STATE_CANCELLED = "cancelled by user";
// const STATE_ERROR = "error";

const New = context => {
  const logger = context.concerns.Logger

  // const StatePrecedence = {
  //   [STATE_UNKNOWN]: 0,
  //   [STATE_FINISHED]: 1,
  //   [STATE_RUNNING]: 2,
  //   [STATE_STALLED]: 3,
  //   [STATE_BAD_PCT]: 4,
  //   [STATE_CANCELLED]: 5,
  //   [STATE_ERROR]: 6
  // };

  // const estJobTotalSeconds = (duration_ms, progress_pct) => duration_ms / (10 * progress_pct); // === (duration_ms/1000) / (progress_pct/100)

  // const estSecondsLeft = statusEntry => {
  //   const pct = safePct(statusEntry);
  //   if(pct) {
  //     if(pct === 100) return 0;
  //     if(pct > 100) {
  //       statusEntry.warning = "Progress percentage > 100, process has generated too much data";
  //       logger.warn(statusEntry.warning);
  //       setBadRunState(statusEntry, STATE_BAD_PCT);
  //       return null;
  //     }
  //     return Math.round(
  //       estJobTotalSeconds(statusEntry.duration_ms, pct)
  //       - (statusEntry.duration_ms / 1000)
  //     );
  //   }
  //   return null; // percent progress = 0
  // };

  // const highestReduce = (statusMap, propName, reducer, startVal) => Object.entries(statusMap).map((pair) => pair[1][propName]).reduce(reducer, startVal);
  // const higherRunState = (a, b) => StatePrecedence[a] > StatePrecedence[b] ? a : b;
  // const highestRunState = statusMap => highestReduce(statusMap, "run_state", higherRunState, STATE_UNKNOWN);
  // const higherSecondsLeft = (a, b) => kindOf(a) === "undefined"
  //   ? a
  //   : kindOf(b) === "undefined"
  //     ? b
  //     : a > b ? a : b;
  //
  // const highestSecondsLeft = statusMap => highestReduce(R.filter(isRunning, statusMap), "estimated_time_left_seconds", higherSecondsLeft, null);
  //
  // const isRunning = x => x.run_state === STATE_RUNNING;
  //
  // const safePct = statusEntry => statusEntry && statusEntry.progress && statusEntry.progress.percentage;

  // const setBadRunState = (statusEntry, state) => {
  //   statusEntry.reported_run_state = statusEntry.run_state;
  //   statusEntry.run_state = state;
  // };

  const mezLRODraftInfo = async ({libraryId, objectId}) => {
    const client = await context.concerns.Client.get()
    const result = await client.ContentObjectMetadata({
      libraryId,
      objectId,
      metadataSubtree: '/lro_draft'
    })
    if(!result || R.isEmpty(result)) {

      // retrieve offering name from /abr_mezzanine/offerings
      const resultAbrMez = await client.ContentObjectMetadata({
        libraryId,
        objectId,
        metadataSubtree: '/abr_mezzanine/offerings'
      })
      if(!resultAbrMez || R.isEmpty(resultAbrMez)) throw Error('mezLRODraftInfo(): No LRO draft info found - mezzanine job already finalized?')

      const offeringKey = Object.entries(resultAbrMez)
        .filter(kvPair => !R.isEmpty(kvPair[1].mez_prep_specs))[0][0]
      if(!offeringKey) throw Error('mezLRODraftInfo(): No LRO draft info found - mezzanine job already finalized?')

      const oldPathResult = await client.ContentObjectMetadata({
        libraryId,
        objectId,
        metadataSubtree: '/lro_draft_' + offeringKey
      })
      if(!oldPathResult || R.isEmpty(oldPathResult)) throw Error('mezLRODraftInfo(): No LRO draft info found - mezzanine job already finalized?')

      return oldPathResult
    }

    return result
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
      throw Error(`Failed to find write token ${writeToken}, has draft already been finalized? (${kindOf(e)})`)
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


    const lroDraftInfo = await mezLRODraftInfo({libraryId, objectId})
    const offeringKey = lroDraftInfo.offering

    const statusResponse = await client.LROStatus({libraryId, objectId, offeringKey})

    if(kindOf(statusResponse) === 'undefined') throw Error('Received no job status information from server - object already finalized?')

    const options = Object.assign(defaultOptions(), {currentTime: new Date})
    const enhanced = enhanceLROStatus(options, statusResponse)
    if(enhanced.ok) {
      return enhanced.result
    } else {
      throw Error(enhanced.errors.join('\n'))
    }
  }

  // const statusMapProcess = statusMap => {
  //   if(kindOf(statusMap) !== "object") throw Error(`statusMap must be an object, got ${kindOf(statusMap)}`);
  //
  //   // examine each entry, add fields
  //   for(const [lroKey, statusEntry] of Object.entries(statusMap)) {
  //     if(statusEntry.run_state === STATE_RUNNING) {
  //       const start = moment.utc(statusEntry.start).valueOf();
  //       const now = moment.utc().valueOf();
  //       const actualElapsedSeconds = Math.round((now - start) / 1000);
  //       const reportedElapsed = Math.round(statusEntry.duration_ms / 1000);
  //       const secondsSinceLastUpdate = actualElapsedSeconds - reportedElapsed;
  //       statusEntry.seconds_since_last_update = secondsSinceLastUpdate;
  //
  //       // off by more than tolerance?
  //       if(secondsSinceLastUpdate > MAX_REPORTED_DURATION_TOLERANCE) {
  //         statusEntry.warning = "status has not been updated in " + secondsSinceLastUpdate + " seconds, process may have terminated";
  //         logger.warn(statusEntry.warning);
  //         setBadRunState(statusEntry, STATE_STALLED);
  //       } else if(safePct(statusEntry) > 100) {
  //         statusEntry.warning = `Job ${lroKey} has progress > 100`;
  //         logger.warn(statusEntry.warning);
  //         setBadRunState(statusEntry, STATE_BAD_PCT);
  //       } else {
  //         const secondsLeft = estSecondsLeft(statusEntry);
  //         if(kindOf(secondsLeft) !== "null") {
  //           statusEntry.estimated_time_left_seconds = secondsLeft;
  //           statusEntry.estimated_time_left_h_m_s = etaString(secondsLeft);
  //         }
  //       }
  //     } else {
  //       if(safePct(statusEntry) !== 100 && statusEntry.run_state === STATE_FINISHED) {
  //         statusEntry.warning = `Job ${lroKey} has run_state '${STATE_FINISHED}', but progress pct is ${safePct(statusEntry)}`;
  //         logger.warn(statusEntry.warning);
  //         setBadRunState(statusEntry, STATE_BAD_PCT);
  //       }
  //     }
  //   }
  //   return statusMap;
  // };

  // const statusReportToBriefList = statusReport => {
  //   if(kindOf(statusReport) !== "object") throw Error(`statusReportToBriefList(): statusReport must be an object, got ${kindOf(statusReport)}`);
  //
  //   const result = [];
  //   for(const [lroKey, statusEntry] of Object.entries(statusReport.LROs)) {
  //     const desc = (statusEntry.desc && statusEntry.desc.split(",")[0]) || "";
  //     result.push({desc, id: lroKey, status: statusEntry.run_state});
  //   }
  //   return R.sortWith(
  //     [
  //       R.ascend(R.prop("desc")),
  //       R.ascend(R.prop("id"))
  //     ],
  //     result
  //   );
  // };

  const warningFound = statusReport => Object.entries(statusReport.LROs).findIndex(
    x => Object.keys(x).includes('warning')
  ) !== -1

  //
  // const statusSummary = statusMap => {
  //   const summary = {run_state: highestRunState(statusMap)};
  //   if(summary.run_state === STATE_RUNNING) {
  //     summary.estimated_time_left_seconds = highestSecondsLeft(statusMap);
  //     if(kindOf(summary.estimated_time_left_seconds) !== "undefined") {
  //       summary.estimated_time_left_h_m_s = etaString(summary.estimated_time_left_seconds);
  //     }
  //   }
  //   return summary;
  // };

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
    mezLRODraftInfo,
    singleLroStatus,
    status,
    // statusMapProcess,
    // statsMapToBriefList,
    // statusSummary,
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
