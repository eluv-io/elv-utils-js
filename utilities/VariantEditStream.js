// Edit an existing stream in an existing variant
const R = require('@eluvio/ramda-fork')

const {MasterModel} = require('./lib/models/MasterModels')
const {VariantModel, VariantStreamModel} = require('./lib/models/VariantModels')

const Utility = require('./lib/Utility')
const {ModOpt, NewOpt} = require('./lib/options')

const VariantStreamArgs = require('./lib/concerns/kits/VariantStreamArgs')
const Edit = require('./lib/concerns/libs/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')

class VariantEditStream extends Utility {
  static blueprint() {
    return {
      concerns: [VariantStreamArgs, ExistObj, Edit],
      options: [
        ModOpt('streamKey', {
          demand: true,
        }),
        NewOpt('clearMapping', {
          descTemplate: 'Blank out the stream\'s mapping_info field',
          type: 'boolean',
          conflicts: 'mapping'
        }),
        NewOpt('clearLanguage', {
          descTemplate: 'Clear stream\'s language field',
          type: 'boolean',
          conflicts: 'language'
        }),
        NewOpt('clearChannelIndex', {
          descTemplate: 'Clear any channel_index values in stream \'sources\' list',
          type: 'boolean',
          conflicts: 'channelIndex'
        }),
        NewOpt('clearMultipliers', {
          descTemplate: 'Clear any multiplier values in stream \'sources\' list',
          type: 'boolean',
          conflicts: 'multipliers'
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

    const {clearChannelIndex, clearLanguage, clearMapping, clearMultipliers} = this.args
    const {streamKey, variantKey} = this.args

    // get production_master metadata
    const master = await this.concerns.ExistObj.metadata({subtree: '/production_master'})

    if(!master.variants[variantKey]) throw Error(`Variant '${variantKey}' not found`)
    const variant = master.variants[variantKey]
    if(!variant.streams[streamKey]) throw Error(`Stream '${streamKey}' not found in variant '${variantKey}'`)

    const sources = master.sources

    // get stream
    const stream = master.variants[variantKey].streams[streamKey]

    // decompose
    const oldStreamOpts = this.context.concerns.VariantStreamArgs.optsFromStream(stream)

    // merge
    const mergedOpts = R.mergeRight(oldStreamOpts, streamOpts)
    if(clearChannelIndex) delete mergedOpts.channelIndex
    if(clearLanguage) delete mergedOpts.language
    if(clearMapping) delete mergedOpts.mapping
    if(clearMultipliers) delete mergedOpts.multipliers

    // recompose
    const revisedStream = this.context.concerns.VariantStreamArgs.streamFromOpts(sources, mergedOpts)

    // validate
    variant.streams[streamKey] = revisedStream
    VariantStreamModel(revisedStream)
    VariantModel(variant)
    MasterModel(master)

    this.logger.log('Saving changes...')
    // write metadata back
    const newHash = await this.concerns.Metadata.write({
      commitMessage: `Edit stream '${streamKey}' of variant '${variantKey}'`,
      libraryId,
      metadata: revisedStream,
      objectId,
      subtree: `/production_master/variants/${variantKey}/streams/${streamKey}`
    })

    this.logger.log(`New version hash: ${newHash}`)
  }

  header() {
    return `Edit stream '${this.args.streamKey}' in variant '${this.args.variantKey}' of production master: ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(VariantEditStream)
} else {
  module.exports = VariantEditStream
}
