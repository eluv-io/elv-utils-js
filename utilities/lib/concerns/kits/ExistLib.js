// template for scripts that work with a library

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

  const metadata = async ({subtree} = {}) => await context.concerns.Library.metadata(
    mergeRight({subtree}, await relevantArgs())
  )

  const partList = async () => await context.concerns.Library.partList(await relevantArgs())

  // Extract out just the (processed) args needed to specify draft in ElvClient calls
  const relevantArgs = async () => (pick(['libraryId'], await argsProc()))

  return {
    argsProc,
    metadata,
    partList
  }
}

module.exports = {
  blueprint,
  New
}
