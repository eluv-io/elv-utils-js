// code related to --writeToken
'use strict'
const {throwError} = require('../../helpers')

const {NewOpt} = require('../../options')

const ArgLibraryId = require('./ArgLibraryId')
const ArgObjectId = require('./ArgObjectId')
const Draft = require('../libs/Draft')
const FabricNode = require('../libs/FabricNode')
const FabricObject = require('../libs/FabricObject')
const Logger = require('../kits/Logger.js')

const blueprint = {
  name: 'ArgWriteToken',
  concerns: [ArgLibraryId, ArgObjectId, Draft, FabricNode, FabricObject, Logger],
  conflicts: 'versionHash',
  options: [
    NewOpt('writeToken', {
      conflicts: 'versionHash',
      descTemplate: 'Write token{X}',
      type: 'string'
    })
  ]
}

const New = context => {

  let argsProcMemo

  // fill in implied missing args
  const argsProc = async () => {
    if(!argsProcMemo) {
      const foundObjectId = context.concerns.Draft.objectId({writeToken: context.args.writeToken})

      if(context.args.objectId) {
        if(context.args.objectId !== foundObjectId) throw Error(`--objectId ${context.args.objectId} supplied, but writeToken ${context.args.writeToken} has object ID: ${foundObjectId}`)
      } else {
        context.args.objectId = foundObjectId
      }

      const foundLibId = await context.concerns.FabricObject.libraryId({objectId: context.args.objectId})
      if(context.args.libraryId) {
        if(context.args.libraryId !== foundLibId) throw Error(`--libraryId ${context.args.libraryId} supplied, but objectId ${context.args.objectId} has library ID: ${foundLibId}`)
      } else {
        context.args.libraryId = foundLibId
      }

      if(context.args.nodeUrl) {
        await context.concerns.Draft.recordWriteTokenNodeURL({
          writeToken: context.args.writeToken,
          nodeUrl: context.args.nodeUrl
        })
      } else {
        context.concerns.Logger.warn('--nodeUrl not supplied, looking up node for write token')
        context.args.nodeUrl = await context.concerns.Draft.nodeURL({writeToken: context.args.writeToken})
        context.concerns.Logger.log(`Found node URL: ${context.args.nodeUrl}`)
      }

      argsProcMemo = context.args
    }
    return argsProcMemo
  }

  const decode = () => context.args.writeToken ?
    context.concerns.Draft.decode({writeToken: context.args.writeToken}) :
    throwError('--writeToken missing')

  // instance interface
  return {
    argsProc,
    decode
  }
}

module.exports = {
  blueprint,
  New
}
