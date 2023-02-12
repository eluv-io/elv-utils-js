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
