// Create new production master from specified file(s)
const path = require('path')

const {ModOpt, NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgDestDir = require('./lib/concerns/args/ArgDestDir')
const ArgNoWait = require('./lib/concerns/ArgNoWait')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const CloudFile = require('./lib/concerns/CloudFile')
const Edit = require('./lib/concerns/Edit')
const LocalFile = require('./lib/concerns/LocalFile')
const Logger = require('./lib/concerns/Logger')

class FilesAdd extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ExistObj, Edit, ArgDestDir, ArgNoWait, LocalFile, CloudFile],
      options: [
        ModOpt('files', {X: 'and/or directories to add'}),
        NewOpt('storeClear', {
          descTemplate: 'If specified, files will use unencrypted storage',
          type: 'boolean'
        })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {destDir, storeClear, noWait} = this.args

    let access
    if(this.args.s3Reference || this.args.s3Copy) access = this.concerns.CloudFile.credentialSet()

    const fileInfo = access
      ? this.concerns.CloudFile.fileInfo()
      : this.concerns.LocalFile.fileInfo()

    const fileHandles = access
      ? []
      : fileInfo.map(x => x.data)

    if (destDir) {
      for (const oneFile of fileInfo) {
        oneFile.path = [destDir, oneFile.path].join('/')
      }
    }

    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const {writeToken} = await this.concerns.Edit.getWriteToken({
      libraryId,
      objectId
    })

    if(access) {
      await this.concerns.CloudFile.add({
        libraryId,
        objectId,
        writeToken,
        access,
        fileInfo,
        encrypt: !storeClear
      })
    } else {
      await this.concerns.LocalFile.add({
        libraryId,
        objectId,
        writeToken,
        fileInfo,
        encrypt: !storeClear
      })
      // Close file handles
      this.concerns.LocalFile.closeFileHandles(fileHandles)
    }

    const fileBasenamesList = this.args.files.map(x => path.basename(x))

    const hash = await this.concerns.Edit.finalize({
      commitMessage: `Add files ${fileBasenamesList.join(', ')}`,
      libraryId,
      noWait,
      objectId,
      writeToken
    })

    logger.logList(
      '',
      'File(s) added.',
      `New version hash: ${hash}`,
      ''
    )

    logger.data('version_hash', hash)
  }

  header() {
    return `Add file(s) to object ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(FilesAdd)
} else {
  module.exports = FilesAdd
}
