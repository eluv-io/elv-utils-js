// template for scripts that work with either an object, a specific version of an object, or a draft of object

const {ModOpt} = require('../../options')

const ExistDft = require('../kits/ExistDft')
const ExistLib = require('../kits/ExistLib')
const ExistObj = require('../kits/ExistObj')
const ExistVer = require('../kits/ExistVer')

const chkNoLibIdOrObjIdOrHashOrToken = (argv) => {
  if(!argv.libraryId && !argv.objectId && !argv.versionHash && !argv.writeToken) {
    throw Error('Must supply one of: --libraryId, --objectId, --versionHash or --writeToken')
  }
  return true // tell yargs that the arguments passed the check
}

const blueprint = {
  name: 'ExistLibOrObjOrVerOrDft',
  concerns: [
    ExistDft,
    ExistLib,
    ExistObj,
    ExistVer
  ],
  options: [
    ModOpt('libraryId', {demand: false}),
    ModOpt('objectId', {demand: false}),
    ModOpt('versionHash', {demand: false}),
    ModOpt('writeToken', {demand: false})
  ],
  checksMap: {chkNoLibIdOrObjIdOrHashOrToken}
}

const New = context => {

  const relevantConcern = context.args.writeToken
    ? context.concerns.ExistDft
    : context.args.versionHash
      ? context.concerns.ExistVer
      : context.args.objectId
        ? context.concerns.ExistObj
        : context.concerns.ExistLib

  // fill in implied missing args
  const argsProc = async () => await relevantConcern.argsProc()

  const info = async () => await relevantConcern.info()

  const metadata = async (params = {}) => await relevantConcern.metadata(params)

  const partList = async () => await relevantConcern.partList()

  const typeHash = async () => await relevantConcern.typeHash()

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
