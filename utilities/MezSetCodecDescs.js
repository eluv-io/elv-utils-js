// Set codec descriptor strings for video stream representations

const {fabricItemDesc} = require('./lib/helpers')
const {NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const Edit = require('./lib/concerns/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const setCodecDescs = require('./lib/misc/setCodecDescs')

class MezSetCodecDescs extends Utility {
  static blueprint() {
    return {
      concerns: [
        Client, ExistObj, Edit
      ],
      options: [
        NewOpt('offeringKey', {
          descTemplate: 'Offering key (in object metadata /offerings/). If omitted, all offerings will be processed.',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const {offeringKey} = this.args
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const offerings = await this.concerns.ExistObj.metadata({subtree: '/offerings'})

    if(!offerings) throw Error('No offerings found in object')
    const metadataOffKeys = Object.keys(offerings)
    if(metadataOffKeys.length === 0) throw Error('No offerings found in object')
    if(offeringKey && !metadataOffKeys.includes(offeringKey)) throw Error(`Offering '${offeringKey}' not found in object`)

    const abrMezOffKeys = offeringKey ? [offeringKey] : Object.keys(offerings)
    const elvClient = await this.concerns.Client.get()

    for(const key of abrMezOffKeys) {
      this.logger.log(`Processing offering '${key}'...`)
      const offeringMetadata = offerings[key]
      offerings[key] = await setCodecDescs({
        elvClient,
        libraryId,
        logger: this.logger,
        objectId,
        offeringKey: key,
        offeringMetadata
      })
    }

    this.logger.log('Write back metadata...')
    // write metadata back to draft
    await this.concerns.Edit.writeMetadata({
      commitMessage: 'Update codec descriptors for video rungs',
      libraryId,
      metadata: offerings,
      metadataSubtree: '/offerings',
      objectId
    })
  }

  header() {
    return `Set codec descriptor strings in bitrate ladder for video stream(s) in ${fabricItemDesc(this.args)}${this.args.offeringKey ? ` (offering '${this.args.offeringKey}')` : ''}.`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MezSetCodecDescs)
} else {
  module.exports = MezSetCodecDescs
}
