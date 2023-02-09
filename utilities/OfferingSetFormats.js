const isEmpty = require('@eluvio/elv-js-helpers/Boolean/isEmpty')
const isNil = require('@eluvio/elv-js-helpers/Boolean/isNil')

const {NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ExistObj = require('./lib/concerns/ExistObj')
const Metadata = require('./lib/concerns/Metadata')
const PlayoutFormats = require('./lib/concerns/PlayoutFormats')

class OfferingSetFormats extends Utility {
  static blueprint() {
    return {
      concerns: [
        ExistObj, Metadata
      ],
      options: [
        NewOpt('offeringKey', {
          default: 'default',
          descTemplate: 'Name of offering.',
          type: 'string'
        }),
        NewOpt('formats', {
          choices: PlayoutFormats.FORMATS,
          demand: true,
          descTemplate: 'What playout formats the offerings should support.',
          string: true,
          type: 'array'
        }),
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {offeringKey, formats} = this.args
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const elvCryptDrmKids = PlayoutFormats.formatsIncludeDrm(formats)
      ? await this.concerns.Metadata.get({
        libraryId,
        objectId,
        subtree: '/elv/crypt/drm/kids'
      })
      : {}

    const offeringMetadata = await this.concerns.Metadata.get({
      libraryId,
      objectId,
      subtree: `/offerings/${offeringKey}`
    })

    if (isNil(offeringMetadata) || isEmpty(offeringMetadata)) throw Error(`Offering '${offeringKey}' not found.`)

    PlayoutFormats.set(offeringMetadata, formats, elvCryptDrmKids)

    // Write back metadata
    const newHash = await this.concerns.Metadata.write({
      commitMessage: `Set playout formats for offering '${offeringKey}' to: ${formats.join(', ')}`,
      libraryId,
      metadata: offeringMetadata,
      objectId,
      subtree: `/offerings/${offeringKey}`
    })
    logger.data('version_hash', newHash)
    logger.log('New version hash: ' + newHash)
  }

  header() {
    return `Set playout formats for offering '${this.args.offeringKey}' in object ${this.args.objectId}.`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(OfferingSetFormats)
} else {
  module.exports = OfferingSetFormats
}
