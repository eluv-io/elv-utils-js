// template for scripts that work with a library
'use strict'

const mergeRight = require('@eluvio/elv-js-helpers/Functional/mergeRight')
const pick = require('@eluvio/elv-js-helpers/Functional/pick')

const {ModOpt} = require('../../options')

const ArgLibraryId = require('../args/ArgLibraryId')
const Library = require('../libs/Library')

const blueprint = {
  name: 'ExistLib',
  concerns: [ArgLibraryId, Library],
  options: [
    ModOpt('libraryId', {demand: true})
  ]
}

const New = context => {

  // libraryId does not imply values for any other args
  // Function is async for consistency with other Exist* concerns
  const argsProc = async () => context.args

  const info = async () => await context.concerns.Library.info(await relevantArgs())

  const metadata = async (options = {}) => await context.concerns.Library.metadata(
    mergeRight(options, await relevantArgs())
  )

  const objectList = async () => await context.concerns.Library.objectList()

  const partList = async () => await context.concerns.Library.partList(await relevantArgs())

  // Extract out just the (processed) args needed to specify draft in ElvClient calls
  const relevantArgs = async () => (
    pick(
      ['libraryId'],
      await argsProc()
    )
  )

  const typeHash = async () => await context.concerns.Library.typeHash(await relevantArgs())

  return {
    argsProc,
    info,
    metadata,
    objectList,
    partList,
    typeHash
  }
}

module.exports = {
  blueprint,
  New
}
