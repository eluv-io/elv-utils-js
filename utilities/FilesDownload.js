// Download file(s) from object
const fs = require('fs')
const path = require('path')

const {fabricItemDesc} = require('./lib/helpers')

const {NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ExistObjOrVer = require('./lib/concerns/ExistObjOrVer')
const Client = require('./lib/concerns/Client')
const Logger = require('./lib/concerns/Logger')
const Metadata = require('./lib/concerns/Metadata')

class FilesDownload extends Utility {
  static blueprint() {
    return {
      concerns: [Client, Logger, ExistObjOrVer],
      options: [
        NewOpt('filePaths', {
          demand: true,
          descTemplate: 'File path(s) within object to download',
          string: true,
          type: 'array'
        }),
        NewOpt('targetDir', {
          default: '.',
          descTemplate: 'Directory to download files to',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {filePaths, targetDir} = this.args

    const {libraryId, objectId} = await this.concerns.ExistObjOrVer.argsProc()
    const client = await this.concerns.Client.get()

    const testTarget = fs.lstatSync(targetDir, {throwIfNoEntry: false})
    if(testTarget) {
      if(!testTarget.isDirectory()) throw Error(`'${targetDir}' is not a directory.`)
    } else {
      throw Error(`Directory '${targetDir}' not found.`)
    }

    const filesMetadata =  await this.concerns.ExistObjOrVer.metadata({subtree:'/files'})
    if(!filesMetadata) throw Error('No files found in object')

    const downloads = []
    const promises = []
    for(const filePath of filePaths) {
      const destPath = path.resolve(path.join(targetDir, filePath))
      if(fs.existsSync(destPath)) throw Error(`'${destPath}' already exists.`)
      if(!Metadata.pathExists({
        path: filePath.startsWith('/') ? filePath : '/' + filePath,
        metadata:filesMetadata
      })) throw Error(`File '${filePath}' not found in object.`)
      const callback = ({bytesFinished,  bytesTotal, chunk}) => {
        logger.log(`${filePath}: ${Math.round(100 * bytesFinished/(bytesTotal || 1))}%`)
        promises.push(fs.promises.appendFile(destPath, chunk))
      }
      downloads.push({file: filePath, destPath, callback})
    }

    for(const dl of downloads) {
      promises.push(
        client.DownloadFile({
          libraryId : libraryId,
          objectId : objectId,
          filePath : dl.file,
          format : 'buffer',
          chunked: true,
          callback: dl.callback
        })
      )
    }

    await Promise.all(promises)
  }

  header() {
    return `Download file(s) from ${fabricItemDesc(this.args)}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(FilesDownload)
} else {
  module.exports = FilesDownload
}
