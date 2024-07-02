// Just create default variant (without deleting other variants)
// Do not scan files

const kindOf = require('kind-of')

const {ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/kits/Client')
const Edit = require('./lib/concerns/libs/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')

class MasterMakeDefaultVariant extends Utility {
  static blueprint() {
    return {
      concerns: [Client, Edit, ExistObj],
      options: [
        ModOpt('objectId', {demand: true})
      ]
    }
  }

  async body() {
    const {objectId, libraryId} = await this.concerns.ExistObj.argsProc()

    const {writeToken} = await this.concerns.Edit.getWriteToken({
      libraryId,
      objectId
    })

    const client = await this.concerns.Client.get()
    const {errors, warnings, logs} = await client.CallBitcodeMethod({
      objectId,
      libraryId,
      method: '/media/production_master/create_default_var',
      writeToken,
      constant: false
    })

    this.logger.errorsAndWarnings({errors, warnings})
    if (logs && logs.length > 0) this.logger.logList('Log:', logs)

    const versionHash = await this.concerns.Edit.finalize({
      commitMessage: 'Create default variant',
      libraryId,
      objectId,
      writeToken
    })

    // Check variant has an audio and video stream
    const variants = (await this.concerns.Metadata.get({
      libraryId,
      objectId,
      versionHash,
      subtree: '/production_master/variants'
    }))

    if (kindOf(variants) !== 'object') throw Error('no variants found after creating default variant!')
    if (!Object.keys(variants).includes('default')) throw Error('variant \'default\' not found after creation!')
    const defaultVariant = variants.default

    const streams = defaultVariant.streams
    if (!Object.keys(streams).includes('audio')) {
      this.logger.warnList('',
        'WARNING: no audio stream found.',
        ''
      )
    }
    if (!Object.keys(streams).includes('video')) {
      this.logger.warnList(
        '',
        'WARNING: no video stream found.',
        ''
      )
    }

    this.logger.data('versionHash', versionHash)
    this.logger.logList(
      '',
      'New version hash: ' + versionHash,
      '')
  }

  header() {
    return `Create default variant in master object ${this.args.objectId}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(MasterMakeDefaultVariant)
} else {
  module.exports = MasterMakeDefaultVariant
}
