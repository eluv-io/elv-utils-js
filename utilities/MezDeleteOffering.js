// Remove an existing offering from a mezzanine

const Utility = require('./lib/Utility')
const {ModOpt} = require('./lib/options')

const ArgOfferingKey = require('./lib/concerns/args/ArgOfferingKey')
const Edit = require('./lib/concerns/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')

class MezDeleteOffering extends Utility {
  static blueprint() {
    return {
      concerns: [ArgOfferingKey, ExistObj, Edit],
      options: [
        ModOpt('offeringKey', {
          default: null,
          demand: true,
        })
      ]
    }
  }

  async body() {
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const {offeringKey} = this.args

    // get offerings metadata
    const offerings = await this.concerns.ExistObj.metadata({subtree: '/offerings'})

    if(!offerings[offeringKey]) throw Error(`Offering '${offeringKey}' not found`)
    delete offerings[offeringKey]

    this.logger.log('Saving changes...')
    // write metadata back
    const newHash = await this.concerns.Metadata.write({
      commitMessage: `Delete offering '${offeringKey}'`,
      libraryId,
      metadata: offerings,
      objectId,
      subtree: '/offerings'
    })

    this.logger.log(`New version hash: ${newHash}`)
  }

  header() {
    return `Delete offering '${this.args.offeringKey}' from mezzanine: ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MezDeleteOffering)
} else {
  module.exports = MezDeleteOffering
}
