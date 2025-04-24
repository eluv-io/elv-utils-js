// Edit an existing stream in an existing variant
'use strict'
const mergeRight = require('@eluvio/elv-js-helpers/Functional/mergeRight')

const {MasterModel} = require('./lib/models/Master')
const {VariantModel, VariantStreamModel} = require('./lib/models/Variant')

const Utility = require('./lib/Utility')
const {ModOpt} = require('./lib/options')

const VariantStreamArgs = require('./lib/concerns/kits/VariantStreamArgs.js')
const VariantStreamClearArgs = require('./lib/concerns/kits/VariantStreamClearArgs.js')

const Edit = require('./lib/concerns/Edit')
const ExistObjOrDft = require('./lib/concerns/kits/ExistObjOrDft')

class VariantEditStream extends Utility {
  static blueprint() {
    return {
      concerns: [VariantStreamArgs, VariantStreamClearArgs, ExistObjOrDft, Edit],
      options: [
        ModOpt('streamKey', {
          demand: true,
        })
      ]
    }
  }

  async body() {
    const {libraryId, objectId} = await this.concerns.ExistObjOrDft.argsProc()

    const streamOpts = this.concerns.VariantStreamArgs.optsFromArgs()

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
    const mergedOpts = this.context.concerns.VariantStreamClearArgs.apply(mergeRight(oldStreamOpts, streamOpts))

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
