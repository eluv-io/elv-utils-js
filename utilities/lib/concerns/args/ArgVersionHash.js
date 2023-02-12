// code related to --versionHash

const {NewOpt} = require('../../options')

const ArgLibraryId = require('./ArgLibraryId')
const ArgObjectId = require('./ArgObjectId')
const Version = require('../libs/Version')

const blueprint = {
  name: 'ArgVersionHash',
  concerns: [ArgLibraryId, ArgObjectId, Version],
  options: [
    NewOpt('versionHash',
      {
        descTemplate: 'Version hash{X} (should start with \'hq__\')',
        type: 'string'
      }
    )
  ]
}

const New = context => {

  let argsProcMemo

  // fill in implied missing args
  const argsProc = async () => {
    if(!argsProcMemo) {
      // decode version hash to get object ID
      const foundObjId = context.concerns.Version.objectId({versionHash: context.args.versionHash})
      // compare versus command line value, if supplied
      if(context.args.objectId && context.args.objectId !== foundObjId) throw Error(`--objectId ${context.args.objectId} supplied, but --versionHash ${context.args.versionHash} is for object ID: ${foundObjId}`)

      context.args.objectId = foundObjId
      // get libraryId
      await context.concerns.ArgObjectId.argsProc()

      argsProcMemo = context.args
    }
    return argsProcMemo
  }

  return {
    argsProc
  }
}

module.exports = {
  blueprint,
  New
}
