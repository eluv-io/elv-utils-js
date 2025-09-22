// Add a stream to an existing variant
'use strict'
const R = require('@eluvio/ramda-fork')

const {MasterModel} = require('./lib/models/Master')
const {VariantModel} = require('./lib/models/Variant')

const Utility = require('./lib/Utility')

const {fabricItemDesc} = require('./lib/helpers')
const {ModOpt} = require('./lib/options')

const VariantStreamArgs = require('./lib/concerns/kits/VariantStreamArgs.js')
const ExistObjOrDft = require('./lib/concerns/kits/ExistObjOrDft')
const Write = require('./lib/concerns/kits/Write')
const clone = require('@eluvio/elv-js-helpers/Functional/clone')

class VariantAddStream extends Utility {
  static blueprint() {
    return {
      concerns: [VariantStreamArgs, ExistObjOrDft, Write],
      options: [
        ModOpt('streamKey', {
          demand: true,
        }),
        ModOpt('file', {
          demand: true,
        }),
        ModOpt('streamIndex', {
          demand: true,
        }),
        ModOpt('label', {
          demand: true,
        })
      ]
    }
  }

  async body() {
    const processedArgs = await this.concerns.ExistObjOrDft.argsProc()

    const streamOpts = R.pick(
      [
        'alternateFor',
        'channelIndex',
        'file',
        'label',
        'language',
        'isDefault',
        'mapping',
        'multipliers',
        'role',
        'streamIndex'
      ],
      this.args
    )

    const {streamKey, variantKey} = this.args

    // get production_master metadata
    const master = await this.concerns.ExistObjOrDft.metadata({subtree: '/production_master'})

    if(!master.variants[variantKey]) throw Error(`Variant '${variantKey}' not found`)
    const variant = master.variants[variantKey]
    const sources = master.sources

    if(variant.streams[streamKey]) throw Error(`Stream '${streamKey}' already exists in variant '${variantKey}'`)

    // create a write token if needed
    const writeInfo = await this.concerns.Write.prepare(processedArgs)

    const {
      commitMsg,
      finalize,
      libraryId,
      newDraftCreated,
      noFinalize,
      noWaitPublish,
      objectId,
      writeToken
    } = Object.assign(
      clone(processedArgs),
      writeInfo
    )

    // create and add stream
    const stream  = this.context.concerns.VariantStreamArgs.streamFromOpts(sources, streamOpts)

    // validate
    variant.streams[streamKey] = stream
    VariantModel(variant)
    MasterModel(master)

    this.logger.log('Saving changes...')
    // write metadata back
    await this.concerns.Metadata.write({
      libraryId,
      metadata: stream,
      objectId,
      subtree: `/production_master/variants/${variantKey}/streams/${streamKey}`,
      writeToken
    })

    await this.concerns.Write.conclude({
      commitMsg,
      defaultCommitMsg: `Add stream '${streamKey}' to variant '${variantKey}'`,
      finalize,
      libraryId,
      newDraftCreated,
      noFinalize,
      noWaitPublish,
      objectId,
      writeToken
    })

  }

  header() {
    return `Add stream '${this.args.streamKey}' to variant '${this.args.variantKey}' of production master: ${fabricItemDesc(this.args)}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(VariantAddStream)
} else {
  module.exports = VariantAddStream
}
