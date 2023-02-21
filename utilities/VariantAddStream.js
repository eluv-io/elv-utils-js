// Add a stream to an existing variant
const R = require('@eluvio/ramda-fork')

const {MasterModel} = require('./lib/models/Master')
const {VariantModel} = require('./lib/models/Variant')

const Utility = require('./lib/Utility')
const {ModOpt} = require('./lib/options')

const VariantStreamArgs = require('./lib/concerns/VariantStreamArgs')
const Edit = require('./lib/concerns/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')

class VariantAddStream extends Utility {
  static blueprint() {
    return {
      concerns: [VariantStreamArgs, ExistObj, Edit],
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
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const streamOpts = R.pick(
      [
        'channelIndex',
        'file',
        'label',
        'language',
        'isDefault',
        'mapping',
        'multipliers',
        'streamIndex'
      ],
      this.args
    )

    const {streamKey, variantKey} = this.args

    // get production_master metadata
    const master = await this.concerns.ExistObj.metadata({subtree: '/production_master'})

    if(!master.variants[variantKey]) throw Error(`Variant '${variantKey}' not found`)
    const variant = master.variants[variantKey]
    const sources = master.sources

    if(variant.streams[streamKey]) throw Error(`Stream '${streamKey}' already exists in variant '${variantKey}'`)

    // create and add stream
    const stream  = this.context.concerns.VariantStreamArgs.streamFromOpts(sources, streamOpts)

    // validate
    variant.streams[streamKey] = stream
    VariantModel(variant)
    MasterModel(master)

    this.logger.log('Saving changes...')
    // write metadata back
    const newHash = await this.concerns.Metadata.write({
      commitMessage: `Add stream '${streamKey}' to variant '${variantKey}'`,
      libraryId,
      metadata: stream,
      objectId,
      subtree: `/production_master/variants/${variantKey}/streams/${streamKey}`
    })
    this.logger.data('version_hash', newHash)
    this.logger.log(`New version hash: ${newHash}`)
  }

  header() {
    return `Add stream '${this.args.streamKey}' to variant '${this.args.variantKey}' of production master: ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(VariantAddStream)
} else {
  module.exports = VariantAddStream
}
