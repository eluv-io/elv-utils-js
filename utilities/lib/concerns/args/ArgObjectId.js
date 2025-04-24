// code related to --objectId
'use strict'

const {NewOpt} = require('../../options')

const ArgLibraryId = require('./ArgLibraryId')
const FabricObject = require('../libs/FabricObject')

const blueprint = {
  name: 'ArgObjectId',
  concerns: [ArgLibraryId, FabricObject],
  options: [
    NewOpt('objectId',
      {
        descTemplate: 'Object ID{X} (should start with \'iq__\')',
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
      const foundLibId = await context.concerns.FabricObject.libraryId({objectId: context.args.objectId})
      if(context.args.libraryId && context.args.libraryId !== foundLibId) throw Error(`--libraryId ${context.args.libraryId} supplied, but objectId ${context.args.objectId} has library ID: ${foundLibId}`)

      context.args.libraryId = foundLibId
      argsProcMemo = context.args
    }

    return argsProcMemo
  }

  const objLatestHash = async () => {
    const {libraryId, objectId} = await argsProc()
    return await context.concerns.FabricObject.latestVersionHash({
      libraryId,
      objectId
    })
  }

  const objPartList = async () => {
    const {libraryId, objectId} = await argsProc()
    return await context.concerns.FabricObject.partList({
      libraryId,
      objectId
    })
  }

  const objVersionList = async () => {
    const {libraryId, objectId} = await argsProc()
    return await context.concerns.FabricObject.versionList({
      libraryId,
      objectId
    })
  }

  // instance interface
  return {
    argsProc,
    objLatestHash,
    objPartList,
    objVersionList
  }
}

module.exports = {
  blueprint,
  New
}
