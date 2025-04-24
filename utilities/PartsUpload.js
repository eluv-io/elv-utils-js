// Upload and create part(s) from local file(s)
'use strict'
const fs = require('fs')
const path = require('path')

const {fabricItemDesc} = require('./lib/helpers')

const {ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ExistObjOrDft = require('./lib/concerns/kits/ExistObjOrDft')
const LocalFile = require('./lib/concerns/kits/LocalFile')
const Logger = require('./lib/concerns/kits/Logger.js')
const Part = require('./lib/concerns/Part')
const Write = require('./lib/concerns/kits/Write')
const clone = require('@eluvio/elv-js-helpers/Functional/clone')


class PartsUpload extends Utility {
  static blueprint() {
    return {
      concerns: [
        ExistObjOrDft,
        LocalFile,
        Logger,
        Part,
        Write
      ],
      options: [
        ModOpt('writeToken', {ofX: ' item to upload part(s) to'}),
        ModOpt('objectId', {ofX: ' item to upload part(s) to'}),
        ModOpt('libraryId', {ofX: ' item to upload part(s) to'}),
        ModOpt('files', {X: 'to create object part(s) from'}),
        ModOpt('storeClear', {descTemplate: 'If specified, parts will be stored unencrypted.'})
      ]
    }
  }

  async body() {
    const result = []

    const logger = this.logger

    const processedArgs = await this.concerns.ExistObjOrDft.argsProc()

    // create a write token if needed
    const writeInfo = await this.concerns.Write.prepare(processedArgs)

    const {
      commitMsg,
      files,
      finalize,
      libraryId,
      newDraftCreated,
      noFinalize,
      noWaitPublish,
      objectId,
      storeClear,
      writeToken
    } = Object.assign(
      clone(processedArgs),
      writeInfo
    )

    let fileHandles = []

    const fileInfo = this.concerns.LocalFile.fileInfo(fileHandles)

    for (const f of fileInfo) {
      logger.log(`  Uploading: ${f.fullPath}...`)
      const partData = fs.readFileSync(f.data)
      const partUploadResult = await this.concerns.Part.upload({
        libraryId,
        objectId,
        writeToken,
        storeClear,
        partData
      })

      const partHash = partUploadResult.partHash
      const partInfo = {
        basename: f.path,
        path: f.fullPath,
        partHash
      }
      logger.dataConcat('parts',[partInfo])
      result.push(partInfo)

      logger.log(`    Uploaded as new part: ${partHash}`)
    }

    // Close file handles
    this.concerns.LocalFile.closeFileHandles(fileHandles)

    const fileBasenamesList = files.map(x => path.basename(x))

    logger.logList(
      '',
      'Part(s) added.'
    )

    logger.logObject(result)

    await this.concerns.Write.conclude({
      commitMsg,
      defaultCommitMsg: `PartsUpload.js: ${fileBasenamesList.join(', ')}`,
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
    return `Add part(s) to ${fabricItemDesc(this.args)} from local file(s)`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(PartsUpload)
} else {
  module.exports = PartsUpload
}
