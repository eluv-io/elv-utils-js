// Upload file(s) or add from S3
'use strict'
const path = require('path')

const clone = require('@eluvio/elv-js-helpers/Functional/clone')

const {fabricItemDesc} = require('./lib/helpers')

const Utility = require('./lib/Utility')

const CloudFile = require('./lib/concerns/kits/CloudFile')
const ExistObjOrDft = require('./lib/concerns/kits/ExistObjOrDft')
const LocalFile = require('./lib/concerns/kits/LocalFile')
const Logger = require('./lib/concerns/kits/Logger.js')
const Write = require('./lib/concerns/kits/Write')

class FilesAdd extends Utility {
  static blueprint() {
    return {
      concerns: [
        CloudFile,
        ExistObjOrDft,
        LocalFile,
        Logger,
        Write
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
      destDir,
      finalize,
      libraryId,
      newDraftCreated,
      noFinalize,
      noWaitPublish,
      objectId,
      s3Copy,
      s3Reference,
      storeClear,
      writeToken
    } = Object.assign(
      clone(processedArgs),
      writeInfo
    )

    const addFromCloud = s3Reference || s3Copy

    if (addFromCloud) {
      await this.concerns.CloudFile.add({
        encrypt: !storeClear,
        libraryId,
        objectId,
        writeToken
      })
    } else {
      await this.concerns.LocalFile.add({
        encrypt: !storeClear,
        libraryId,
        objectId,
        writeToken
      })
    }

    const fileBasenamesList = this.args.files.map(x => path.basename(x))

    logger.logList(
      '',
      'File(s) added.'
    )

    await this.concerns.Write.conclude({
      commitMsg,
      defaultCommitMsg: `FilesAdd.js: ${fileBasenamesList.join(', ')}${destDir ? ` to folder ${destDir}` : ''}`,
      finalize,
      libraryId,
      newDraftCreated,
      noFinalize,
      noWaitPublish,
      objectId,
      writeToken
    })


    // let accessc
    // if (this.args.s3Reference || this.args.s3Copy) access = this.concerns.CloudFile.credentialSet()
    //
    // let fileHandles = []
    // const fileInfo = access
    //   ? this.concerns.CloudFile.fileInfo()
    //   : this.concerns.LocalFile.fileInfo(fileHandles)
    //
    // if (destDir) {
    //   for (const f of fileInfo) {
    //     f.path = path.join(destDir, f.path)
    //   }
    // }
    //
    // const {libraryId, objectId, writeToken} = await this.concerns.ExistObjOrDft.argsProc()
    //
    // const suppliedOrNewWriteToken = writeToken || (await this.concerns.Edit.getWriteToken({
    //   libraryId,
    //   objectId
    // })).writeToken
    //
    // if (access) {
    //   await this.concerns.CloudFile.add({
    //     libraryId,
    //     objectId,
    //     writeToken: suppliedOrNewWriteToken,
    //     access,
    //     fileInfo,
    //     encrypt: !storeClear
    //   })
    // } else {
    //   await this.concerns.LocalFile.add({
    //     libraryId,
    //     objectId,
    //     writeToken: suppliedOrNewWriteToken,
    //     fileInfo,
    //     encrypt: !storeClear
    //   })
    //   // Close file handles
    //   this.concerns.LocalFile.closeFileHandles(fileHandles)
    // }
    //
    // const fileBasenamesList = this.args.files.map(x => path.basename(x))
    //
    // logger.logList(
    //   '',
    //   'File(s) added.'
    // )

    // if (!writeToken) {
    //   const hash = await this.concerns.Edit.finalize({
    //     commitMessage: `Add files ${fileBasenamesList.join(', ')}${destDir ? ` to folder ${destDir}` : ''}`,
    //     libraryId,
    //     noWait,
    //     objectId,
    //     writeToken: suppliedOrNewWriteToken
    //   })
    //   logger.log(`New version hash: ${hash}`)
    //   logger.data('version_hash', hash)
    // }

    logger.log('')
  }

  header() {
    return `Add file(s) to ${this.args.destDir ? `directory '${this.args.destDir}' in ` : ''}${fabricItemDesc(this.args)}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(FilesAdd)
} else {
  module.exports = FilesAdd
}
