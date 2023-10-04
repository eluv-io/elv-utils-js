// Download part(s) from object
const fs = require('fs')
const path = require('path')

const {fabricItemDesc} = require('./lib/helpers')

const {NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const ExistLibOrObjOrVerOrDft = require('./lib/concerns/kits/ExistLibOrObjOrVerOrDft')
const Logger = require('./lib/concerns/Logger')
const Part = require('./lib/concerns/Part')

class PartsDownload extends Utility {
  static blueprint() {
    return {
      concerns: [Client, Logger, ExistLibOrObjOrVerOrDft, Part],
      options: [
        NewOpt('partHashes', {
          demand: true,
          descTemplate: 'Part(s) to download',
          string: true,
          type: 'array'
        }),
        NewOpt('targetDir', {
          default: '.',
          descTemplate: 'Directory to download parts to',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {partHashes, targetDir} = this.args

    const {libraryId, objectId, versionHash, writeToken} = await this.concerns.ExistLibOrObjOrVerOrDft.argsProc()

    const client = await this.concerns.Client.get()
    for(const partHash of partHashes) {
      logger.log(`${partHash}...`)
      const arrayBuffer = await client.DownloadPart({
        libraryId,
        objectId,
        partHash,
        versionHash,
        writeToken
      })

      fs.writeFileSync(
        path.join(targetDir, partHash),
        Buffer.from(arrayBuffer)
      )
    }
  }

  header() {
    return `Download part(s) from ${fabricItemDesc(this.args)}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(PartsDownload)
} else {
  module.exports = PartsDownload
}
