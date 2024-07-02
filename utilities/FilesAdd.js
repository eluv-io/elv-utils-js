// Create new production master from specified file(s)
const path = require('path')

const {fabricItemDesc} = require('./lib/helpers')

const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgDestDir = require('./lib/concerns/args/ArgDestDir')
const ArgNoWaitPublish = require('./lib/concerns/args/ArgNoWaitPublish')
const ExistObjOrDft = require('./lib/concerns/kits/ExistObjOrDft')
const CloudFile = require('./lib/concerns/kits/CloudFile')
const Edit = require('./lib/concerns/libs/Edit')
const LocalFile = require('./lib/concerns/kits/LocalFile')
const Logger = require('./lib/concerns/kits/Logger')

class FilesAdd extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ExistObjOrDft, Edit, ArgDestDir, ArgNoWaitPublish, LocalFile, CloudFile],
      options: [
        ModOpt('destDir', {descTemplate: 'Destination directory within object (must start with \'/\'). Will be created if it does not exist.',}),
        ModOpt('files', {X: 'to add'}),
        NewOpt('storeClear', {
          descTemplate: 'If specified, files will use unencrypted storage',
          type: 'boolean'
        })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {storeClear, noWaitPublish, destDir} = this.args

    let access
    if(this.args.s3Reference || this.args.s3Copy) access = this.concerns.CloudFile.credentialSet()

    let fileHandles = []
    const fileInfo = access
      ? this.concerns.CloudFile.fileInfo()
      : this.concerns.LocalFile.fileInfo(fileHandles)

    if (destDir) {
      for (const f of fileInfo) {
        f.path = path.join(destDir, f.path)
      }
    }

    const {libraryId, objectId, writeToken} = await this.concerns.ExistObjOrDft.argsProc()

    const suppliedOrNewWriteToken = writeToken || (await this.concerns.Edit.getWriteToken({
      libraryId,
      objectId
    })).writeToken

    if(access) {
      await this.concerns.CloudFile.add({
        libraryId,
        objectId,
        writeToken: suppliedOrNewWriteToken,
        access,
        fileInfo,
        encrypt: !storeClear
      })
    } else {
      await this.concerns.LocalFile.add({
        libraryId,
        objectId,
        writeToken: suppliedOrNewWriteToken,
        fileInfo,
        encrypt: !storeClear
      })
      // Close file handles
      this.concerns.LocalFile.closeFileHandles(fileHandles)
    }

    const fileBasenamesList = this.args.files.map(x => path.basename(x))

    logger.logList(
      '',
      'File(s) added.'
    )

    if (!writeToken) {
      const hash = await this.concerns.Edit.finalize({
        commitMessage: `Add files ${fileBasenamesList.join(', ')}${destDir ? ` to folder ${destDir}` : ''}`,
        libraryId,
        noWait: noWaitPublish,
        objectId,
        writeToken: suppliedOrNewWriteToken
      })
      logger.log(`New version hash: ${hash}`)
      logger.data('versionHash', hash)
    }
    logger.log('')
  }

  header() {
    return `Add file(s) to ${this.args.destDir ? `directory '${this.args.destDir}' in `: ''}${fabricItemDesc(this.args)}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(FilesAdd)
} else {
  module.exports = FilesAdd
}
