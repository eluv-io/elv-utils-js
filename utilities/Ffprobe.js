'use strict'
// ffprobe a file

const Utility = require('./lib/Utility')
const {ModOpt} = require('./lib/options')

const ArgFile = require('./lib/concerns/args/ArgFile')
const LocalFfprobe = require('./lib/concerns/libs/LocalFfprobe')

class Ffprobe extends Utility {
  static blueprint() {
    return {
      concerns: [ArgFile, LocalFfprobe],
      options: [
        ModOpt('file', {
          demand: true,
          X: 'media'
        })
      ]
    }
  }

  async body() {
    const result = JSON.parse(this.concerns.LocalFfprobe.probe(this.args.file))

    this.logger.data('writeTokenInfo', result)
    this.logger.log(JSON.stringify(result, null, 2))
  }

  header() {
    return 'Execute local ffprobe command on file to get stream info'
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(Ffprobe)
} else {
  module.exports = Ffprobe
}
