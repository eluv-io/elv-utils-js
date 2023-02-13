// template for scripts that work with a specific version of an object

const pick = require('@eluvio/elv-js-helpers/Functional/pick')
const mergeRight = require('@eluvio/elv-js-helpers/Functional/mergeRight')

const {ModOpt} = require('../../options')

const ArgVersionHash = require('../args/ArgVersionHash')
const Version = require('../libs/Version')

const blueprint = {
  name: 'ExistVer',
  concerns: [ArgVersionHash, Version],
  options: [
    ModOpt('versionHash', {demand: true})
  ]
}

const New = context => {

  // fill in implied missing args
  const argsProc = async () => await context.concerns.ArgVersionHash.argsProc()

  const info = async() => await context.concerns.Version.info(await relevantArgs())

  const metadata = async ({subtree} = {}) => await context.concerns.Version.metadata(
    mergeRight({subtree}, await relevantArgs())
  )

  const partList = async () => await context.concerns.Version.partList(await relevantArgs())

  // extract out just the (processed) args needed to specify version in ElvClient calls
  const relevantArgs = async () => (pick(['libraryId', 'objectId', 'versionHash'], await argsProc()))

  const typeHash = async() => await context.concerns.Version.typeHash(await relevantArgs())

  return {
    argsProc,
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
