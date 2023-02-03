const Utility = require('./lib/Utility')
const {ModOpt, NewOpt} = require('./lib/options')

const ArgOfferingKey = require('./lib/concerns/ArgOfferingKey')
const Edit = require('./lib/concerns/Edit')
const ExistObj = require('./lib/concerns/ExistObj')

class MezCopyOffering extends Utility {
  blueprint() {
    return {
      concerns: [ArgOfferingKey, ExistObj, Edit],
      options: [
        ModOpt('offeringKey', {
          default: null,
          demand: true,
          descTemplate: 'Which offering to copy'
        }),
        NewOpt('newOfferingKey', {
          demand: true,
          descTemplate:'Offering key for the new copy',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const {newOfferingKey, offeringKey} = this.args

    // get offering metadata
    const offerings = await this.concerns.ExistObj.metadata({subtree: '/offerings'})

    if(!offerings[offeringKey]) throw Error(`Offering '${offeringKey}' not found`)

    if(offerings[newOfferingKey]) throw Error(`Offering '${newOfferingKey}' already exists`)

    offerings[newOfferingKey] = offerings[offeringKey]

    this.logger.log('Saving changes...')
    // write metadata back
    const newHash = await this.concerns.Metadata.write({
      commitMessage: `Copy offering '${offeringKey}' to '${newOfferingKey}'`,
      libraryId,
      metadata: offerings,
      objectId,
      subtree: '/offerings'
    })

    this.logger.log(`New version hash: ${newHash}`)
  }

  header() {
    return `Copy offering '${this.args.offeringKey}' to '${this.args.newOfferingKey}' in mezzanine: ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MezCopyOffering)
} else {
  module.exports = MezCopyOffering
}
