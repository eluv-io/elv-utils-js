// template for scripts that work with a specific version of an object
'use strict'

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

  const del = async () => await context.concerns.Version.del(await relevantArgs())

  const info = async() => await context.concerns.Version.info(await relevantArgs())

  const libraryId = async () => await relevantArgs().libraryId

  const metadata = async (options = {}) => await context.concerns.Version.metadata(
    mergeRight(options, await relevantArgs())
  )

  const objectId = async () => await relevantArgs().objectId

  const partList = async () => await context.concerns.Version.partList(await relevantArgs())

  // extract out just the (processed) args needed to specify version in ElvClient calls
  const relevantArgs = async () => (pick(['libraryId', 'objectId', 'versionHash'], await argsProc()))

  const typeHash = async() => await context.concerns.Version.typeHash(await relevantArgs())

  return {
    argsProc,
    del,
    info,
    libraryId,
    metadata,
    objectId,
    partList,
    typeHash
  }
}

module.exports = {
  blueprint,
  New
}
