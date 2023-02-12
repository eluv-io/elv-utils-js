const R = require('@eluvio/ramda-fork')

const {ModOpt, StdOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgLibraryId = require('./lib/concerns/ArgLibraryId')
const ArgMetadata = require('./lib/concerns/ArgMetadata')
const ArgType = require('./lib/concerns/ArgType')

class ObjectCreate extends Utility {
  static blueprint() {
    return {
      concerns: [ArgLibraryId, ArgType, ArgMetadata],
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
    const {name} = this.args
    const type = this.args.type
      ? await this.concerns.ArgType.typVersionHash()
      : undefined
    const metadataFromArg = this.concerns.ArgMetadata.asObject() || {}
    const metadata = R.mergeDeepRight(metadataFromArg, {'public':{name}})

    const {objectId, versionHash} = await this.concerns.ArgLibraryId.libCreateObject({
      commitMessage: 'create object',
      metadata,
      type
    })

    logger.log(`New object ID: ${objectId}`)
    logger.data('objectId', objectId)
    logger.log(`version hash: ${versionHash}`)
    logger.data('versionHash', versionHash)
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
