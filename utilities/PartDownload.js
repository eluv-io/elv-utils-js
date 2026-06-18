// Download part from object
'use strict'
const fs = require('fs')
const path = require('path')

const {ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgOutfile = require('./lib/concerns/args/ArgOutfile')
const ArgPartHash = require('./lib/concerns/args/ArgPartHash')
const Client = require('./lib/concerns/Client')
const Logger = require('./lib/concerns/kits/Logger.js')

class PartDownload extends Utility {
  static blueprint() {
    return {
      concerns: [ArgOutfile, ArgPartHash, Client, Logger],
      options: [
        ModOpt('outfile', {
          X: 'part',
          demand: true,
          // X: 'part'
        }),
        ModOpt('partHash', {
          demand: true
        })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {outfile, partHash} = this.args

    const client = await this.concerns.Client.get()


    const destPath = path.resolve(outfile)
    if (fs.existsSync(destPath)) throw Error(`'${destPath}' already exists.`)
    const callback = ({bytesFinished, bytesTotal, chunk}) => {
      logger.log(`${destPath}: ${Math.round(100 * bytesFinished / (bytesTotal || 1))}%`)
      fs.appendFileSync(destPath, chunk)
    }

    await client.DownloadPart({
      libraryId: 'ilib3Ew3hjfno4EeatoNRpZrRJGv51Vf',
      objectId: 'iq__3dvWEG6bCu7he3ofW2pbB8BSQACp',
      partHash,
      format: 'buffer',
      chunked: true,
      callback
    })

  }

  header() {
    return `Download part ${this.args.partHash}`
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(PartDownload)
} else {
  module.exports = PartDownload
}
