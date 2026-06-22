// Add a new variant to a production master
'use strict'
const {MasterModel} = require('./lib/models/Master')
const {VariantModel} = require('./lib/models/Variant')

const Utility = require('./lib/Utility')
const {ModOpt, NewOpt} = require('./lib/options')
const {fabricItemDesc} = require('./lib/helpers')

const ArgVariantKey = require('./lib/concerns/args/ArgVariantKey.js')
const ExistObjOrDft = require('./lib/concerns/kits/ExistObjOrDft')
const ProcessJSON = require('./lib/concerns/libs/ProcessJSON.js')
const Write = require('./lib/concerns/kits/Write')
const clone = require('@eluvio/elv-js-helpers/Functional/clone')

class MasterAddVariant extends Utility {
  static blueprint() {
    return {
      concerns: [ArgVariantKey, ExistObjOrDft, ProcessJSON, Write],
      options: [
        ModOpt('variantKey', {
          default: null,
          demand: true,
          descTemplate: 'Key for new variant'
        }),
        NewOpt('streams', {
          demand: true,
          descTemplate:'Either a JSON string containing stream specifications for new variant, or the path to a JSON file containing the info',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const logger = this.logger

    const processedArgs = await this.concerns.ExistObjOrDft.argsProc()

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
      variantKey,
      writeToken
    } = Object.assign(
      clone(processedArgs),
      writeInfo
    )


    const streams = this.concerns.ProcessJSON.parseStringOrFile({strOrPath: this.args.streams})
    const variant = {streams}
    VariantModel(variant)

    // get production_master metadata
    const master = await this.concerns.ExistObjOrDft.metadata({subtree: '/production_master'})
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
    logger.log('Saving changes...')
    // write metadata back
    await this.concerns.Metadata.write({
      libraryId,
      metadata: master.variants,
      objectId,
      subtree: '/production_master/variants',
      writeToken
    })

    await this.concerns.Write.conclude({
      commitMsg,
      defaultCommitMsg: `MasterAddVariant.js: Add variant '${variantKey}'`,
      finalize,
      libraryId,
      newDraftCreated,
      noFinalize,
      noWaitPublish,
      objectId,
      writeToken
    })

    logger.log('')
  }

  header() {
    return `Add variant '${this.args.variantKey}' to production master in ${fabricItemDesc(this.args)}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MasterAddVariant)
} else {
  module.exports = MasterAddVariant
}
