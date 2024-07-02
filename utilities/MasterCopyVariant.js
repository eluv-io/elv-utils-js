// Copy an existing variant

const Utility = require('./lib/Utility')
const {ModOpt, NewOpt} = require('./lib/options')

const ArgVariantKey = require('./lib/concerns/args/ArgVariantKey')
const Edit = require('./lib/concerns/libs/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')

class MasterCopyVariant extends Utility {
  static blueprint() {
    return {
      concerns: [ArgVariantKey, ExistObj, Edit],
      options: [
        ModOpt('variantKey', {
          default: null,
          demand: true,
          descTemplate: 'Which variant to copy'
        }),
        NewOpt('newVariantKey', {
          demand: true,
          descTemplate:'Variant key for the new copy',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const {newVariantKey, variantKey} = this.args

    // get production_master metadata
    const variants = await this.concerns.ExistObj.metadata({subtree: '/production_master/variants'})

    if(!variants[variantKey]) throw Error(`Variant '${variantKey}' not found`)

    if(variants[newVariantKey]) throw Error(`Variant '${newVariantKey}' already exists`)

    variants[newVariantKey] = variants[variantKey]

    this.logger.log('Saving changes...')
    // write metadata back
    const newHash = await this.concerns.Metadata.write({
      commitMessage: `Copy variant '${variantKey}' to '${newVariantKey}'`,
      libraryId,
      metadata: variants,
      objectId,
      subtree: '/production_master/variants'
    })

    this.logger.log(`New version hash: ${newHash}`)
  }

  header() {
    return `Copy variant '${this.args.variantKey}' to '${this.args.newVariantKey}' in production master: ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MasterCopyVariant)
} else {
  module.exports = MasterCopyVariant
}
