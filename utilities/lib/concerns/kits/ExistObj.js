// template for scripts that work with an existing fabric object

const pick = require('@eluvio/elv-js-helpers/Functional/pick')
const mergeRight = require('@eluvio/elv-js-helpers/Functional/mergeRight')

const {ModOpt} = require('../../options')

const ArgObjectId = require('../args/ArgObjectId')
const FabricObject = require('../libs/FabricObject')

const blueprint = {
  name: 'ExistObj',
  concerns: [ArgObjectId, FabricObject],
  options: [
    ModOpt('objectId', {demand: true})
  ]
}

const New = context => {

  // fill in any implied missing args
  const argsProc = async () => await context.concerns.ArgObjectId.argsProc()

  const metadata = async ({subtree} = {}) => await context.concerns.FabricObject.metadata(
    mergeRight({subtree}, await relevantArgs())
  )

  const partList = async () => await context.concerns.FabricObject.partList(await relevantArgs())

  // extract out just the (processed) args needed to specify object in ElvClient calls
  const relevantArgs = async () => (pick(['libraryId', 'objectId'], await argsProc()))

  const versionList = async () => await context.concerns.FabricObject.versionList(await relevantArgs())

  return {
    argsProc,
    metadata,
    partList,
    versionList
  }
}

module.exports = {
  blueprint,
  New
}
