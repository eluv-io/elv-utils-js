'use strict'

const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const TH = require('../test-helpers.js')
const DraftFinalize = TH.requireUtility('DraftFinalize')
const ListFiles = TH.requireUtility('ListFiles')
const MetaGet = TH.requireUtility('MetaGet')
const ObjectCreate = TH.requireUtility('ObjectCreate')

if (!process.env.ELVUTILS_CONFIG) throwError('Environment variable ELVUTILS_CONFIG must be set in order to run integration tests')

const createDraft = async ({name, libraryId, metadata}) => {
  let argList = [
    '--name', name,
    '--libraryId', libraryId,
    '--noFinalize'
  ]
  if (metadata) {
    argList.push('--metadata')
    argList.push(metadata)
  }
  const result = await new ObjectCreate({argList}).run()
  if (result.exitCode !== 0) {throwError`createDraft failed: ${result.errors}`}
  return result.data
}

const getFileList = async({libraryId, objectId, versionHash, writeToken}) => {
  let argList = [].concat(
    libraryId ? ['--libraryId',libraryId] : [],
    objectId ? ['--objectId',objectId] : [],
    versionHash ? ['--versionHash',versionHash] : [],
    writeToken ? ['--writeToken',writeToken] : []
  )
  const result = await new ListFiles({argList}).run()
  if (result.exitCode !== 0) {throwError`getFileList failed: ${result.errors}`}
  return result.data.files
}

const getMetadata = async ({libraryId, objectId, versionHash, writeToken, path}) => {
  let argList = [].concat(
    path ? ['--path',path] : [],
    libraryId ? ['--libraryId',libraryId] : [],
    objectId ? ['--objectId',objectId] : [],
    versionHash ? ['--versionHash',versionHash] : [],
    writeToken ? ['--writeToken',writeToken] : []
  )
  const result = await new MetaGet({argList}).run()
  if (result.exitCode !== 0) {throwError`getMetadata failed: ${result.errors}`}
  return (await new MetaGet({argList}).run()).data.metadata
}

const finalizeDraft = async ({writeToken, nodeUrl}) => {
  let argList = [].concat(
    nodeUrl ? ['--nodeUrl',nodeUrl] : [],
    writeToken ? ['--writeToken',writeToken] : []
  )
  const result = await new DraftFinalize({argList}).run()
  if (result.exitCode !== 0) {throwError`finalizeDraft failed: ${result.errors}`}
  return (await new DraftFinalize({argList}).run()).data
}

module.exports = {
  createDraft,
  finalizeDraft,
  getFileList,
  getMetadata
}
