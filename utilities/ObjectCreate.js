// Create a new Fabric Object in a Library
'use strict'
const mergeDeepRight = require('@eluvio/elv-js-helpers/Functional/mergeDeepRight')

const {ModOpt, StdOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgCommitMsg = require('./lib/concerns/args/ArgCommitMsg')
const ArgLibraryId = require('./lib/concerns/args/ArgLibraryId')
const ArgMetadata = require('./lib/concerns/ArgMetadata')
const ArgNoFinalize = require('./lib/concerns/args/ArgNoFinalize')
const ArgType = require('./lib/concerns/ArgType')
const FabricObject = require('./lib/concerns/libs/FabricObject')

class ObjectCreate extends Utility {
  static blueprint() {
    return {
      concerns: [
        ArgCommitMsg,
        ArgLibraryId,
        ArgMetadata,
        ArgNoFinalize,
        ArgType,
        FabricObject
      ],
      options: [
        ModOpt('libraryId', {demand: true}),
        StdOpt('name',
          {
            demand: true,
            forX: 'new object'
          })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {commitMsg, libraryId, name, noFinalize} = this.args
    const type = this.args.type
      ? await this.concerns.ArgType.typVersionHash()
      : undefined
    const metadataFromArg = this.concerns.ArgMetadata.asObject() || {}
    const metadata = mergeDeepRight(metadataFromArg, {'public':{name}})

    const {objectId, versionHash, writeToken} = await this.concerns.FabricObject.create({
      commitMessage: commitMsg,
      libraryId,
      metadata,
      noFinalize,
      type
    })

    logger.log(`New object ID: ${objectId}`)
    logger.data('objectId', objectId)
    if (writeToken) {
      logger.log('Draft NOT finalized')
      logger.log(`write token: ${writeToken}`)
      logger.data('writeToken', writeToken)
    } else {
      logger.log('Draft finalized')
      logger.log(`version hash: ${versionHash}`)
      logger.data('versionHash', versionHash)
    }
  }

  header() {
    return `Create object '${this.args.name}' in lib ${this.args.libraryId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(ObjectCreate)
} else {
  module.exports = ObjectCreate
}
