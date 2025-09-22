// template for scripts that work with an existing fabric object
'use strict'

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

  const del = async () => await context.concerns.FabricObject.del(await relevantArgs())

  const info = async() => await context.concerns.FabricObject.info(await relevantArgs())

  const libraryId = async () => await relevantArgs().libraryId

  const metadata = async (options = {}) => await context.concerns.FabricObject.metadata(
    mergeRight(options, await relevantArgs())
  )

  const partList = async () => await context.concerns.FabricObject.partList(await relevantArgs())

  const permission = async () => await context.concerns.FabricObject.permission(await relevantArgs())

  // extract out just the (processed) args needed to specify object in ElvClient calls
  const relevantArgs = async () => (pick(['libraryId', 'objectId'], await argsProc()))

  const typeHash = async () => await context.concerns.FabricObject.typeHash(await relevantArgs())

  const versionList = async () => await context.concerns.FabricObject.versionList(await relevantArgs())

  return {
    argsProc,
    del,
    info,
    libraryId,
    metadata,
    partList,
    permission,
    typeHash,
    versionList
  }
}

module.exports = {
  blueprint,
  New
}
