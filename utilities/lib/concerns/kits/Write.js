// options and arguments related to writing to fabric,
// starting edits, finalizing, waiting for publish
'use strict'

const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')

const throwIfArgsBad = require('@eluvio/elv-js-helpers/Validation/throwIfArgsBad')

const LibraryIdModel = require('../../models/LibraryIdModel')
const ObjectIdModel = require('../../models/ObjectIdModel')
const WriteTokenModel = require('../../models/WriteTokenModel')

const ArgCommitMsg = require('../args/ArgCommitMsg')
const ArgFinalize = require('../args/ArgFinalize')
const ArgNoFinalize = require('../args/ArgNoFinalize')
const ArgNoWaitPublish = require('../args/ArgNoWaitPublish')
const ArgPublishTimeout = require('../args/ArgPublishTimeout')
const Draft = require('../libs/Draft')

const blueprint = {
  name: 'Write',
  concerns: [
    ArgCommitMsg,
    ArgFinalize,
    ArgNoFinalize,
    ArgNoWaitPublish,
    ArgPublishTimeout,
    Draft
  ]
}

// const ASSERT_NEW_DRAFT_EXPECTED = args => {
//   // finalize must not be supplied
// }
//
// const ASSERT_NEW_DRAFT_NOT_EXPECTED = args => {
//   // noFinalize must not be supplied
// }
//
// const ASSERT_FINALIZE_EXPECTED = args => {
//   // noFinalize must not be supplied
// }
//
// const ASSERT_FINALIZE_NOT_EXPECTED = args => {
//   // finalize must not be supplied
//   // commitMsg must not be supplied
//   // noWaitPublish must not be supplied
//   // publishTimeout must not be supplied
// }

const WRITE_CONCLUDE_ARGSMODEL = defObjectModel(
  'Write.conclude()',
  {
    commitMsg: [NonBlankStrModel],
    defaultCommitMsg: [NonBlankStrModel],
    finalize: [Boolean],
    libraryId: LibraryIdModel,
    newDraftCreated: Boolean,
    noFinalize: [Boolean],
    noWaitPublish: [Boolean],
    objectId: ObjectIdModel,
    writeToken: WriteTokenModel,
  }
) // .assert()

const WRITE_PREPARE_ARGSMODEL = defObjectModel(
  'Write.prepare()',
  {
    libraryId: LibraryIdModel,
    objectId: ObjectIdModel,
    writeToken: [WriteTokenModel],
  }
) // .assert()

const finalizeExpected = ({newDraftCreated, noFinalize, finalize}) =>
  newDraftCreated ? !noFinalize : finalize

const newDraftExpected = ({writeToken}) => !writeToken

const New = context => {

  const logger = context.concerns.Logger

  const conclude = async ({
    commitMsg,
    defaultCommitMsg,
    finalize,
    libraryId,
    newDraftCreated,
    noFinalize,
    noWaitPublish,
    objectId,
    writeToken
  }) => {
    throwIfArgsBad(
      WRITE_CONCLUDE_ARGSMODEL,
      {
        commitMsg,
        defaultCommitMsg,
        finalize,
        libraryId,
        newDraftCreated,
        noFinalize,
        noWaitPublish,
        objectId,
        writeToken
      }
    )

    if (finalizeExpected({newDraftCreated, noFinalize, finalize})) {

      const versionHash = await context.concerns.Draft.finalize({
        commitMessage: commitMsg || defaultCommitMsg || 'Finalized by elv-utils-js',
        libraryId,
        noWait: noWaitPublish,
        objectId,
        writeToken
      })

      logger.log('Draft finalized')
      logger.data('versionHash', versionHash)
      logger.log(`New version hash: ${versionHash}`)

      return {
        finalized: true,
        versionHash
      }

    } else {

      logger.data('writeToken', writeToken)
      logger.log(
        newDraftCreated
          ? `New write token: ${writeToken}`
          : `Write token: ${writeToken}`
      )
      logger.log('Draft NOT finalized')

      return {
        finalized: false,
        writeToken
      }
    }
  }

  // If write token is passed in, returns it
  // otherwise, will create a new draft using libraryId and objectId.
  // Returns {newDraftCreated, nodeUrl, objectId, writeToken}
  const prepare = async ({libraryId, objectId, writeToken}) => {
    throwIfArgsBad(WRITE_PREPARE_ARGSMODEL, {libraryId, objectId, writeToken})
    if (!newDraftExpected({writeToken})) {
      const nodeUrl = await context.concerns.Draft.nodeURL({writeToken})
      return {
        newDraftCreated: false,
        nodeUrl,
        objectId,
        writeToken
      }
    }

    // Draft.createForExistingObject() returns {nodeUrl, objectId, writeToken}
    const result = await context.concerns.Draft.createForExistingObject({
      libraryId,
      objectId
    })

    return Object.assign({newDraftCreated: true}, result)
  }

  return {
    conclude,
    prepare
  }
}

module.exports = {
  blueprint,
  finalizeExpected,
  New,
  newDraftExpected
}
