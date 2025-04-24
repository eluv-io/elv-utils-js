// code related to --noWaitPublish arg (skip wait for finalized new version to become available)
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgNoWaitPublish',
  options: [
    NewOpt('noWaitPublish', {
      descTemplate: 'When finalizing, exit script immediately after finalize call rather than waiting for publish to finish',
      type: 'boolean',
      conflicts: 'noFinalize'
    })
  ]
}

// eslint-disable-next-line no-unused-vars
const New = context => {
  // const logger = context.concerns.Logger
  // const {noWaitPublish} = context.args
  //
  // const finalize = async ({libraryId, objectId, writeToken}) => {
  //   if(noWaitPublish) logger.log('Finalize object (--no-wait-publish specified)')
  //   return await context.concerns.Finalize.finalize({
  //     libraryId,
  //     noWait: noWaitPublish,
  //     objectId,
  //     writeToken,
  //   })
  // }
  //
  // // Needed as a separate function to call after client.FinalizeABRMezzanine()
  // const waitUnlessNo = async ({latestHash, libraryId, objectId}) => {
  //   if(noWaitPublish) {
  //     logger.log('--no-wait-publish specified, bypassing wait for publish to finish (finalized new object version may take up to several minutes to become available, depending on size and number of parts.')
  //   } else {
  //     await context.concerns.Finalize.waitForPublish({libraryId,objectId,latestHash})
  //   }
  // }
  //
  // return {finalize, waitUnlessNo}

  return {}
}

module.exports = {
  blueprint,
  New
}
