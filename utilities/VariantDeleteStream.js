// Remove an existing stream from an existing variant

const Utility = require('./lib/Utility')
const {ModOpt} = require('./lib/options')

const ArgStreamKey = require('./lib/concerns/args/ArgStreamKey')
const ArgVariantKey = require('./lib/concerns/args/ArgVariantKey')
const Edit = require('./lib/concerns/libs/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')

class VariantDeleteStream extends Utility {
  static blueprint() {
    return {
      concerns: [ArgStreamKey,ArgVariantKey, ExistObj, Edit],
      options: [
        ModOpt('streamKey', {
          demand: true,
        })
      ]
    }
  }

  async body() {
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const {streamKey, variantKey} = this.args

    // get production_master metadata
    const variants = await this.concerns.ExistObj.metadata({subtree: '/production_master/variants'})

    if(!variants[variantKey]) throw Error(`Variant '${variantKey}' not found`)
    const variant = variants[variantKey]

    if(!variant.streams[streamKey]) throw Error(`Stream '${streamKey}' not found in variant '${variantKey}'`)

    delete variant.streams[streamKey]

    this.logger.log('Saving changes...')
    // write metadata back
    const newHash = await this.concerns.Metadata.write({
      commitMessage: `Delete stream '${streamKey}' from variant '${variantKey}'`,
      libraryId,
      metadata: variant,
      objectId,
      subtree: `/production_master/variants/${variantKey}`
    })

    this.logger.log(`New version hash: ${newHash}`)
  }

  header() {
    return `Delete stream '${this.args.streamKey}' from variant '${this.args.variantKey}' of production master: ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(VariantDeleteStream)
} else {
  module.exports = VariantDeleteStream
}
