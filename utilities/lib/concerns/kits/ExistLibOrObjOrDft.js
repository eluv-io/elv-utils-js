// template for scripts that work with a library or object or a draft of an object/library

const {ModOpt} = require('../../options')

const ExistDft = require('../kits/ExistDft')
const ExistObj = require('../kits/ExistObj')
const ExistLib = require('../kits/ExistLib')

const chkNoLibOrObjectIdOrToken = (argv) => {
  if (!argv.libraryId && !argv.objectId && !argv.writeToken) {
    throw Error('Must supply --libraryId, --objectId, or --writeToken')
  }
  return true // tell yargs that the arguments passed the check
}

const blueprint = {
  name: 'ExistLibOrObjOrDft',
  concerns: [ExistLib, ExistDft, ExistObj],
  options: [
    ModOpt('libraryId', {demand: false}),
    ModOpt('objectId', {demand: false}),
    ModOpt('writeToken', {demand: false})
  ],
  checksMap: {chkNoLibOrObjectIdOrToken}
}

const New = context => {

  const relevantConcern = context.args.writeToken
    ? context.concerns.ExistDft
    : context.args.objectId
      ? context.concerns.ExistObj
      : context.concerns.ExistLib

  const argsProc = async () => await relevantConcern.argsProc()

  const info = async () => await relevantConcern.info()

  const metadata = async (options = {}) => await relevantConcern.metadata(options)

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
