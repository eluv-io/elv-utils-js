// Remove an existing variant from a production master

const Utility = require('./lib/Utility')
const {ModOpt} = require('./lib/options')

const ArgVariantKey = require('./lib/concerns/ArgVariantKey')
const Edit = require('./lib/concerns/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')

class MasterDeleteVariant extends Utility {
  static blueprint() {
    return {
      concerns: [ArgVariantKey, ExistObj, Edit],
      options: [
        ModOpt('variantKey', {
          default: null,
          demand: true,
        })
      ]
    }
  }

  async body() {
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const {variantKey} = this.args

    // get production_master metadata
    const variants = await this.concerns.ExistObj.metadata({subtree: '/production_master/variants'})

    if(!variants[variantKey]) throw Error(`Variant '${variantKey}' not found`)
    delete variants[variantKey]

    this.logger.log('Saving changes...')
    // write metadata back
    const newHash = await this.concerns.Metadata.write({
      commitMessage: `Delete variant '${variantKey}'`,
      libraryId,
      metadata: variants,
      objectId,
      subtree: '/production_master/variants'
    })

    this.logger.log(`New version hash: ${newHash}`)
  }

  header() {
    return `Delete variant '${this.args.variantKey}' from production master: ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MasterDeleteVariant)
} else {
  module.exports = MasterDeleteVariant
}
