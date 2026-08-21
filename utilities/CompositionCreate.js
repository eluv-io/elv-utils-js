// Create a composition

const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgLibraryId = require('./lib/concerns/ArgLibraryId')
const ArgObjectId = require('./lib/concerns/ArgObjectId')
const ArgType = require('./lib/concerns/ArgType')
const ArgWriteToken = require('./lib/concerns/ArgWriteToken')
const Client = require('./lib/concerns/Client')

const Draft = require('./lib/concerns/libs/Draft')

const Composition = require('./lib/concerns/libs/Composition')
const ContentType = require('./lib/concerns/ContentType')
const FabricObject = require('./lib/concerns/libs/FabricObject')
const Finalize = require('./lib/concerns/Finalize')
const JSON = require('./lib/concerns/JSON')
const Metadata = require('./lib/concerns/Metadata')

const chkLibraryPresent = (argv) => {
  if (!argv.objectId && !argv.writeToken && !argv.libraryId) {
    throw Error('--libraryId must be supplied unless --objectId or --writeToken are present')
  }
  return true
}

const chkTypePresent = (argv) => {
  if (!argv.objectId && !argv.writeToken && !argv.type) {
    throw Error('--type must be supplied unless --objectId or --writeToken are present')
  }
  return true
}

const chkNamePresent = (argv) => {
  if (!argv.objectId && !argv.writeToken && !argv.name) {
    throw Error('--name must be supplied unless --objectId or --writeToken are present')
  }
  return true
}

class CompositionCreate extends Utility {
  static blueprint() {
    return {
      concerns: [
        ArgLibraryId,
        ArgObjectId,
        ArgType,
        ArgWriteToken,
        Client,
        Composition,
        ContentType,
        Draft,
        FabricObject,
        Finalize,
        JSON,
        Metadata
      ],
      options: [
        ModOpt('libraryId', {
          forX: 'object to add composition to'
        }),
        ModOpt('objectId', {
          forX: 'object to add composition to'
        }),
        ModOpt('writeToken', {
          forX: 'draft to add composition to'
        }),
        ModOpt('type', {
          forX: 'new object to add composition to (only if --objectId or --writeToken not specified)'
        }),
        NewOpt('offeringKey', {
          default: 'default',
          descTemplate: 'Offering key to assign to new composition',
          type: 'string'
        }),
        NewOpt('content', {
          demand: true,
          descTemplate: 'JSON string or path to file specifying content for composition',
          type: 'string'
        }),
        NewOpt('name', {
          descTemplate: 'Name for new object (only if --objectId or --writeToken not specified)',
          type: 'string'
        })
      ],
      checksMap: {chkTypePresent, chkTitlePresent: chkNamePresent, chkLibraryPresent}
    }
  }

  async body() {
    const logger = this.logger

    const compSpec = this.concerns.JSON.parseStringOrFile({strOrPath: this.args.content})

    const writeTokenSupplied = !!this.args.writeToken
    const objectIdSupplied = !!this.args.objectId
    const createNewObject = !writeTokenSupplied && !objectIdSupplied
    const createNewDraft = !createNewObject && !writeTokenSupplied

    const client = await this.concerns.Client.get()

    if (writeTokenSupplied) {
      await this.concerns.ArgWriteToken.argsProc()
    } else if (objectIdSupplied) {
      await this.concerns.ArgObjectId.argsProc()
    }

    let {
      libraryId,
      objectId,
      writeToken,
      offeringKey,
      name,
      type
    } = this.args

    const metadata = compSpec.version === 1
      ? await this.concerns.Composition.v1Metadata({
        content: compSpec,
        libraryId,
        objectId,
        writeToken
      })
      : compSpec.version === 2
        ? await this.concerns.Composition.v2Metadata({
          content: compSpec,
          libraryId,
          objectId,
          writeToken
        })
        : throwError(`unrecognized composition version number ${compSpec.version}`)

    if (createNewObject) {
      ({objectId, writeToken} = await this.concerns.Draft.create({
        libraryId,
        metadata: {'public': {name}},
        type
      }))
    } else if (createNewDraft) {
      ({writeToken} = await this.concerns.Draft.create({
        libraryId,
        objectId,
        type
      }))
    }

    const  metadataSubtree = `/channel/offerings/${offeringKey}`

    logger.log('Writing metadata to object...')
    await client.ReplaceMetadata({
      libraryId,
      metadata,
      metadataSubtree,
      objectId,
      writeToken
    })

    if (writeTokenSupplied) {
      logger.log('\nWrite token NOT finalized.')
      logger.log(`Write token: ${writeToken}`)
    } else {
      const
        latestHash = await this.concerns.Finalize.finalize({
          commitMessage: `Create composition '${offeringKey}'`,
          libraryId,
          objectId,
          writeToken
        })
      logger.data('version_hash', latestHash)
      logger.log(`\nNew version_hash: ${latestHash}`)
    }
  }

  header() {
    return `Create composition '${this.args.offeringKey}'`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(CompositionCreate)
} else {
  module.exports = CompositionCreate
}