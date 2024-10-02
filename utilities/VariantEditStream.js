// Edit an existing stream in an existing variant
const R = require('@eluvio/ramda-fork')

const {MasterModel} = require('./lib/models/Master')
const {VariantModel, VariantStreamModel} = require('./lib/models/Variant')

const Utility = require('./lib/Utility')
const {ModOpt, NewOpt} = require('./lib/options')

const VariantStreamArgs = require('./lib/concerns/VariantStreamArgs')
const Edit = require('./lib/concerns/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')

class VariantEditStream extends Utility {
  static blueprint() {
    return {
      concerns: [VariantStreamArgs, ExistObj, Edit],
      options: [
        ModOpt('streamKey', {
          demand: true,
        }),
        NewOpt('clearDeinterlace', {
          descTemplate: 'Blank out the stream\'s deinterlace field',
          type: 'boolean',
          conflicts: 'deinterlace'
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
        }),
        NewOpt('clearTargetFrameRate', {
          descTemplate: 'Blank out the stream\'s target_frame_rate field',
          type: 'boolean',
          conflicts: 'targetFrameRate'
        })
      ]
    }
  }

  async body() {
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const streamOpts = R.pick(
      [
        'channelIndex',
        'deinterlace',
        'file',
        'label',
        'language',
        'isDefault',
        'mapping',
        'multipliers',
        'streamIndex',
        'targetFrameRate'
      ],
      this.args
    )



    const {clearChannelIndex, clearDeinterlace, clearLanguage, clearMapping, clearMultipliers, clearTargetFrameRate} = this.args
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
    if(clearDeinterlace) delete mergedOpts.deinterlace
    if(clearLanguage) delete mergedOpts.language
    if(clearMapping) delete mergedOpts.mapping
    if(clearMultipliers) delete mergedOpts.multipliers
    if(clearTargetFrameRate) delete mergedOpts.target_frame_rate

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
