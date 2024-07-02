// Set codec descriptor strings for video stream representations

const clone = require('@eluvio/elv-js-helpers/Functional/clone')

const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const {fabricItemDesc} = require('./lib/helpers')
const {ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgReplace = require('./lib/concerns/args/ArgReplace')
const ArgTags = require('./lib/concerns/args/ArgTags')
const ArgOfferingKey = require('./lib/concerns/args/ArgOfferingKey')
const Client = require('./lib/concerns/kits/Client')
const Edit = require('./lib/concerns/libs/Edit')
const ExistObjOrDft = require('./lib/concerns/kits/ExistObjOrDft')
const Offering = require('./lib/concerns/libs/Offering')
const VideoTag = require('./lib/concerns/libs/VideoTag')
const Write = require('./lib/concerns/kits/Write')

class MezSetVideoTags extends Utility {
  static blueprint() {
    return {
      concerns: [
        ArgOfferingKey,
        ArgReplace,
        ArgTags,
        Client,
        Edit,
        ExistObjOrDft,
        Offering,
        VideoTag,
        Write
      ],
      options: [
        ModOpt('tags', {demand: true}),
        ModOpt('offeringKey', {X: 'to use to determine video untrimmed duration'})
      ]
    }
  }

  async body() {
    const processedArgs = await this.concerns.ExistObjOrDft.argsProc()

    // {libraryId, objectId, writeToken, replace, offeringKey} =

    // retrieve and validate tag data
    const tagTracks = this.concerns.ArgTags.asObject()

    // create a write token if needed
    const writeInfo = await this.concerns.Write.prepare(processedArgs)

    // merge info into user-supplied args and then destructure
    // into individual constants
    const {
      commitMsg,
      finalize,
      libraryId,
      newDraftCreated,
      noFinalize,
      noWaitPublish,
      objectId,
      offeringKey,
      replace,
      writeToken
    } = Object.assign(
      clone(processedArgs),
      writeInfo
    )

    // check for existing data
    const metaExists = await this.concerns.VideoTag.metaExists({
      libraryId,
      objectId,
      writeToken
    })

    if (metaExists) {
      if (replace) {
        this.logger.warn('/video_tags already exists in object metadata: --replace specified, existing tags will be removed')
      } else {
        throwError('/video_tags already exists in object metadata. Use --replace to overwrite')
      }
    }

    const filesExist = await this.concerns.VideoTag.filesExist({
      libraryId,
      objectId,
      writeToken
    })

    if (filesExist) {
      if (replace) {
        this.logger.warn('Directory /video_tags in object contains video-tags-tracks-####.json files: --replace specified, existing video-tags-tracks-####.json files will be removed')
      } else {
        throwError('Directory /video_tags in object contains files. Use --replace to overwrite')
      }
    }

    // get Offering duration
    const offering = await this.concerns.Offering.get({
      libraryId,
      objectId,
      offeringKey,
      writeToken
    })

    if (!offering) throwError(`Offering '${offeringKey}' not found in ${fabricItemDesc(this.args)}`)

    const offeringDurSec = Offering.durationNum({offering})

    await this.concerns.VideoTag.replace({
      libraryId,
      objectId,
      offeringDurSec,
      tagTracks,
      writeToken
    })

    const conclusion = await this.concerns.Write.conclude({
      commitMsg,
      defaultCommitMsg: 'Set video tags',
      finalize,
      libraryId,
      newDraftCreated,
      noFinalize,
      noWaitPublish,
      objectId,
      writeToken
    })

    if (conclusion.finalized) {
      const {versionHash} = conclusion
      this.logger.log(`New version hash: ${versionHash}`)
      this.logger.data('versionHash', versionHash)
    } else {
      this.logger.log(`${newDraftCreated ? 'New w' : 'W'}rite token: ${writeToken}`)
      this.logger.data('writeToken', writeToken)
    }
  }

  header() {
    return `Set video tags in ${fabricItemDesc(this.args)}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(MezSetVideoTags)
} else {
  module.exports = MezSetVideoTags
}
