// Add a subtitle stream to one Offering
'use strict'
const fs = require('fs')
const path = require('path')

const isEmpty = require('@eluvio/elv-js-helpers/Boolean/isEmpty')
const isNil = require('@eluvio/elv-js-helpers/Boolean/isNil')
const isNumber = require('@eluvio/elv-js-helpers/Boolean/isNumber')

const {ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgFile = require('./lib/concerns/args/ArgFile')
const ArgForced = require('./lib/concerns/args/ArgForced')
const ArgIsDefault = require('./lib/concerns/args/ArgIsDefault')
const ArgLabel = require('./lib/concerns/args/ArgLabel')
const ArgLanguage = require('./lib/concerns/args/ArgLanguage')
const ArgOfferingKey = require('./lib/concerns/args/ArgOfferingKey')
const ArgStoreClear = require('./lib/concerns/args/ArgStoreClear')
const ArgStreamKey = require('./lib/concerns/args/ArgStreamKey.js')
const ArgTimeShift = require('./lib/concerns/args/ArgTimeShift.js')
const Edit = require('./lib/concerns/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const Metadata = require('./lib/concerns/Metadata')
const Part = require('./lib/concerns/Part')
const Subtitle = require('./lib/concerns/libs/Subtitle.js')

class OfferingAddSubtitles extends Utility {
  static blueprint() {
    return {
      concerns: [
        ExistObj, Metadata, Subtitle, Edit, Part,
        ArgFile, ArgForced, ArgIsDefault, ArgLabel, ArgLanguage, ArgOfferingKey, ArgStoreClear, ArgStreamKey, ArgTimeShift
      ],
      options: [
        ModOpt('file', {
          demand: true,
          X: 'subtitle'
        }),
        ModOpt('offeringKey', {
          X: 'to add subtitle stream to'
        }),
        ModOpt('storeClear', {
          X: 'to store subtitle data'
        }),
        ModOpt('streamKey', {
          descTemplate: 'Key for new subtitle stream',
          demand: true
        }),
        ModOpt('label', {
          demand: true,
          X: 'to show in player for subtitle stream'
        }),
        ModOpt('language', {
          demand: true,
          X: 'for subtitle stream'
        }),
        ModOpt('isDefault', {
          X: 'subtitle stream'
        }),
        ModOpt('timeShift', {
          X: 'from timestamps in subtitle file'
        })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {
      forced,
      isDefault,
      label,
      language,
      offeringKey,
      storeClear,
      streamKey,
      timeShift
    } = this.args

    const filePath = this.args.file
    const fileName = path.basename(filePath)

    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const offering = await this.concerns.Metadata.get({
      libraryId,
      objectId,
      subtree: `/offerings/${offeringKey}`
    })

    if (isNil(offering) || isEmpty(offering)) throw Error(`Offering '${offeringKey}' not found.`)

    const useClearStorage = storeClear || offering.store_clear

    // read captions file and apply any time shift
    let originalData = fs.readFileSync(filePath)
    const partData = isNumber(timeShift) && (timeShift !== 0)
      ? Subtitle.adjustTimestamps(timeShift, originalData)
      : originalData

    const {writeToken} = await this.concerns.Edit.getWriteToken({libraryId, objectId})
    // upload part
    const partUploadResult = await this.concerns.Part.upload({
      libraryId,
      objectId,
      writeToken,
      storeClear: useClearStorage,
      partData
    })
    const partHash = partUploadResult.partHash
    console.log(`Subtitles uploaded as new part: ${partHash}`)

    const revisedOffering = Subtitle.addToOffering({
      offering,
      partHash,
      forced,
      isDefault,
      label,
      language,
      streamKey
    })

    // Write back metadata
    await this.concerns.Metadata.write({
      libraryId,
      metadata: revisedOffering,
      objectId,
      subtree: `/offerings/${offeringKey}`,
      writeToken,
    })

    // finalize
    const newHash = await this.concerns.Edit.finalize({
      commitMessage: `Add subtitle stream from file '${fileName}' to offering '${offeringKey}'`,
      libraryId,
      objectId,
      writeToken
    })

    logger.data('version_hash', newHash)
    logger.log('New version hash: ' + newHash)
  }

  header() {
    return `Add subtitle stream to offering '${this.args.offeringKey}' in object ${this.args.objectId}.`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(OfferingAddSubtitles)
} else {
  module.exports = OfferingAddSubtitles
}
