// Add a new variant to a production master
'use strict'
const {MasterModel} = require('./lib/models/Master')
const {VariantModel} = require('./lib/models/Variant')

const Utility = require('./lib/Utility')
const {ModOpt, NewOpt} = require('./lib/options')

const ArgVariantKey = require('./lib/concerns/ArgVariantKey')
const Edit = require('./lib/concerns/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const ProcessJSON = require('./lib/concerns/libs/ProcessJSON.js')

class MasterAddVariant extends Utility {
  static blueprint() {
    return {
      concerns: [ArgVariantKey, ExistObj, Edit, ProcessJSON],
      options: [
        ModOpt('variantKey', {
          default: null,
          demand: true,
          descTemplate: 'Key for new variant'
        }),
        NewOpt('streams', {
          demand: true,
          descTemplate:'JSON string (or file path if prefixed with \'@\') containing stream specifications for new variant',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const {variantKey} = this.args

    const streams = this.concerns.ProcessJSON.parseStringOrFile({strOrPath: this.args.streams})
    const variant = {streams}
    VariantModel(variant)

    // get production_master metadata
    const master = await this.concerns.ExistObj.metadata({subtree: '/production_master'})
    if(master.variants[variantKey]) throw Error(`Variant '${variantKey}' already exists`)

    const sources = master.sources
    const testMaster = {
      sources,
      variants: {
        [variantKey]: variant
      }
    }

    MasterModel(testMaster)

    master.variants[variantKey] = variant
    this.logger.log('Saving changes...')
    // write metadata back
    const newHash = await this.concerns.Metadata.write({
      commitMessage: `Add variant '${variantKey}'`,
      libraryId,
      metadata: master.variants,
      objectId,
      subtree: '/production_master/variants'
    })

    this.logger.log(`New version hash: ${newHash}`)
  }

  header() {
    return `Add variant '${this.args.variantKey}' to production master: ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MasterAddVariant)
} else {
  module.exports = MasterAddVariant
}
