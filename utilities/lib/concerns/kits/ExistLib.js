// template for scripts that work with a library

const mergeRight = require('@eluvio/elv-js-helpers/Functional/mergeRight')
const pick = require('@eluvio/elv-js-helpers/Functional/pick')

const {ModOpt} = require('../../options')

const ArgLibraryId = require('../args/ArgLibraryId')
const FabricObject = require('../libs/FabricObject')
const Library = require('../libs/Library')

const blueprint = {
  name: 'ExistLib',
  concerns: [ArgLibraryId, FabricObject, Library],
  options: [
    ModOpt('libraryId', {demand: true})
  ]
}

const New = context => {

  // libraryId does not imply values for any other args
  // Function is async for consistency with other Exist* concerns
  const argsProc = async () => context.args

  const createObject = async ({commitMessage, metadata, noWait, type}) => await context.concerns.FabricObject.create({
    commitMessage,
    libraryId: context.args.libraryId,
    metadata,
    noWait,
    type
  })

  const info = async () => await context.concerns.Library.info(await relevantArgs())

  const metadata = async ({subtree} = {}) => await context.concerns.Library.metadata(
    mergeRight({subtree}, await relevantArgs())
  )

  const objectId = async () => await context.concerns.Library.objectId({libraryId: context.args.libraryId})

  const objectList = async({filterOptions}= {}) => await context.concerns.Library.objectList({filterOptions, libraryId: context.args.libraryId})

  const partList = async () => await context.concerns.Library.partList(await relevantArgs())

  // Extract out just the (processed) args needed to specify draft in ElvClient calls
  const relevantArgs = async () => (pick(['libraryId'], await argsProc()))

  const typeHash = async () => await context.concerns.Library.typeHash(await relevantArgs())

  return {
    argsProc,
    createObject,
    info,
    metadata,
    objectId,
    objectList,
    partList,
    typeHash
  }
}

module.exports = {
  blueprint,
  New
}
