// template for scripts that work with either an object or a specific version of an object

const {ModOpt} = require('../../options')

const ExistObj = require('../kits/ExistObj')
const ExistVer = require('../kits/ExistVer')

const chkNoObjectIdOrHash = (argv) => {
  if(!argv.objectId && !argv.versionHash) {
    throw Error('Must supply either --objectId or --versionHash')
  }
  return true // tell yargs that the arguments passed the check
}

const blueprint = {
  name: 'ExistObjOrVer',
  concerns: [ExistObj, ExistVer],
  options: [
    ModOpt('objectId', {demand: false}),
    ModOpt('versionHash', {demand: false})
  ],
  checksMap: {chkNoObjectIdOrHash}
}

const New = context => {

  const relevantConcern = context.args.versionHash
    ? context.concerns.ExistVer
    : context.concerns.ExistObj

  const argsProc = async () => await relevantConcern.argsProc()

  const del = async () => await relevantConcern.del()

  const info = async () => await relevantConcern.info()

  const libraryId = async () => await relevantConcern.libraryId()

  const metadata = async (params = {}) => await relevantConcern.metadata(params)

  const partList = async () => await relevantConcern.partList()

  const typeHash = async () => await relevantConcern.typeHash()

  return {
    argsProc,
    del,
    info,
    libraryId,
    metadata,
    partList,
    typeHash
  }
}

module.exports = {
  blueprint,
  New
}
