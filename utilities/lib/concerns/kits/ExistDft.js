// template for scripts that work with a draft of an object
'use strict'

const mergeRight = require('@eluvio/elv-js-helpers/Functional/mergeRight')
const pick = require('@eluvio/elv-js-helpers/Functional/pick')

const {ModOpt} = require('../../options')

const ArgNodeUrl = require('../args/ArgNodeUrl')
const ArgWriteToken = require('../args/ArgWriteToken')
const Draft = require('../libs/Draft')

const blueprint = {
  name: 'ExistDft',
  concerns: [ArgNodeUrl, ArgWriteToken, Draft],
  options: [
    ModOpt('writeToken', {demand: true})
  ]
}

const New = context => {

  // fill in implied missing args
  const argsProc = async () => await context.concerns.ArgWriteToken.argsProc()

  const finalize = async ({commitMessage, noWait}) => {
    const params = mergeRight(
      await relevantArgs(),
      {
        commitMessage,
        noWait
      }
    )
    return await context.concerns.Draft.finalize(params)
  }

  const info = async() => await context.concerns.Draft.info(await relevantArgs())

  const metadata = async (options = {}) => await context.concerns.Draft.metadata(
    mergeRight(options, await relevantArgs())
  )

  const partList = async () => await context.concerns.Draft.partList(await relevantArgs())

  // extract out just the (processed) args needed to specify draft in ElvClient calls
  const relevantArgs = async () => (pick(['libraryId', 'objectId', 'writeToken'], await argsProc()))

  const typeHash = async() => await context.concerns.Draft.typeHash(await relevantArgs())

  return {
    argsProc,
    finalize,
    info,
    metadata,
    partList,
    typeHash
  }
}

module.exports = {
  blueprint,
  New
}
