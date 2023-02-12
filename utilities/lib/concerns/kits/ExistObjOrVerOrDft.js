// template for scripts that work with either an object, a specific version of an object, or a draft of object

const {ModOpt} = require('../../options')

const ExistDft = require('../kits/ExistDft')
const ExistObj = require('../kits/ExistObj')
const ExistVer = require('../kits/ExistVer')

const chkNoObjectIdOrHashOrToken = (argv) => {
  if(!argv.objectId && !argv.versionHash && !argv.writeToken) {
    throw Error('Must supply one of: --objectId, --versionHash or --writeToken')
  }
  return true // tell yargs that the arguments passed the check
}

const blueprint = {
  name: 'ExistObjOrVerOrDft',
  concerns: [
    ExistDft,
    ExistObj,
    ExistVer
  ],
  options: [
    ModOpt('objectId', {demand: false}),
    ModOpt('versionHash', {demand: false}),
    ModOpt('writeToken', {demand: false})
  ],
  checksMap: {chkNoObjectIdOrHashOrToken}
}

const New = context => {

  const relevantConcern = context.args.writeToken
    ? context.concerns.ExistDft
    : context.args.versionHash
      ? context.concerns.ExistVer
      : context.concerns.ExistObj

  // fill in implied missing args
  const argsProc = async () => await relevantConcern.argsProc()

  const metadata = async ({subtree} = {}) => await relevantConcern.metadata({subtree})

  const partList = async () => await relevantConcern.partList()

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
