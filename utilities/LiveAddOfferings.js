// Create multiple live offerings

const clone = require('@eluvio/elv-js-helpers/Functional/clone')
const objToEntries = require('@eluvio/elv-js-helpers/Conversion/objToEntries')
const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const {fabricItemDesc, readFileJSON} = require('./lib/helpers')
const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ExistObjOrDft = require('./lib/concerns/kits/ExistObjOrDft')
const Metadata = require('./lib/concerns/Metadata')
const ArgCommitMsg = require('./lib/concerns/args/ArgCommitMsg')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

class LiveAddOfferings extends Utility {
  static blueprint() {
    return {
      concerns: [
        ExistObjOrDft,
        Metadata,
        ArgCommitMsg
      ],
      options: [
        ModOpt('writeToken', {ofX: ' item to modify'}),
        ModOpt('objectId', {ofX: ' item to modify'}),
        ModOpt('libraryId', {ofX: ' item to modify'}),
        NewOpt('specFile', {
          demand: true,
          descTemplate: 'Path to local JSON file defining the live offerings.',
          coerce: NonBlankStrModel,
          type: 'string'
        }),
        ModOpt('commitMsg', {conflicts: 'writeToken'}),
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {specFile} = this.args

    const commitMessage = this.args.commitMsg || (
      this.args.writeToken
        ? undefined
        : 'Add live offerings'
    )

    const specs = readFileJSON(specFile)

    // operations that may need to wait on network access
    // ----------------------------------------------------
    const {libraryId, objectId, writeToken} = await this.concerns.ExistObjOrDft.argsProc()

    logger.log('Retrieving /offerings/default from object...')
    let defaultOffering = await this.concerns.ExistObjOrDft.metadata({subtree: '/offerings/default'})
    defaultOffering.mez_prep_specs = {}
    defaultOffering.log = {}

    const audioStreamTemplate = defaultOffering.playout.streams.audio
    const audioStreamKeys = specs.live_stream_keys.audio

    const videoStreamTemplate = defaultOffering.playout.streams.video
    const videoStreamKeys = specs.live_stream_keys.video

    let newOfferingTemplate = clone(defaultOffering)
    newOfferingTemplate.playout.streams = {}
    newOfferingTemplate.play_mode = 'avtest_live'

    let newOfferings = {default: defaultOffering}

    objToEntries(specs.additional_offerings).forEach(([offeringKey, spec]) => {
      if (offeringKey === 'default') throwError('"default" is not a legal name for an additional live offering')
      let offering = clone(newOfferingTemplate)
      objToEntries(spec.streams).forEach(([streamKey, streamSpec]) => {
        let stream = {}
        if (videoStreamKeys.includes(streamSpec.live_key)) {
          stream = clone(videoStreamTemplate)
        } else if (audioStreamKeys.includes(streamSpec.live_key)) {
          stream = clone(audioStreamTemplate)
        } else {
          throwError(`live_key '${streamSpec.live_key}' not valid (offering: ${offeringKey}, stream: ${streamKey})`)
        }

        stream.label = streamSpec.label
        stream.default_for_media_type = streamSpec.default_for_media_type

        Object.keys(stream.representations).forEach(repKey => stream.representations[repKey].media_struct_stream_key = streamSpec.live_key)

        offering.playout.streams[streamKey] = stream
      })
      newOfferings[offeringKey] = offering
    })


    // Write back metadata
    const newHash = await this.concerns.Metadata.write({
      commitMessage,
      libraryId,
      metadata: newOfferings,
      metadataSubtree: '/offerings',
      objectId,
      writeToken
    })

    if (!writeToken) this.logger.data('version_hash', newHash)
  }

  header() {
    return `Add live offerings for ${fabricItemDesc(this.args)}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(LiveAddOfferings)
} else {
  module.exports = LiveAddOfferings
}
