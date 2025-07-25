// template for scripts that work with either an object or a draft of an object

const {ModOpt} = require('../../options')

const ExistDft = require('../kits/ExistDft')
const ExistObj = require('../kits/ExistObj')

const chkNoObjectIdOrToken = (argv) => {
  if(!argv.objectId && !argv.writeToken) {
    throw Error('Must supply either --objectId or --writeToken')
  }
  return true // tell yargs that the arguments passed the check
}

const blueprint = {
  name: 'ExistObjOrDft',
  concerns: [ExistDft, ExistObj],
  options: [
    ModOpt('objectId', {demand: false}),
    ModOpt('writeToken', {demand: false})
  ],
  checksMap: {chkNoObjectIdOrToken}
}

const New = context => {

  const relevantConcern = context.args.writeToken
    ? context.concerns.ExistDft
    : context.concerns.ExistObj

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
