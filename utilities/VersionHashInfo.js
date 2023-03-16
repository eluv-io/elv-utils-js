// Retrieve part list from object
const Utility = require('./lib/Utility')

const Version = require('./lib/concerns/libs/Version')
const {NewOpt} = require('./lib/options')

class VersionHashInfo extends Utility {
  static blueprint() {
    return {
      concerns: [Version],
      options: [
        NewOpt('versionHash', {
          demand: true,
          descTemplate: 'Version hash to decode',
          type: 'string'
        })
      ]
    }
  }

  async body() {
    const {versionHash} = this.args
    const result = this.concerns.Version.decode({versionHash})
    this.logger.data('versionHashInfo', result)
    this.logger.log(JSON.stringify(result, null, 2))
  }

  header() {
    return `Print info for version hash ${this.args.versionHash}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(VersionHashInfo)
} else {
  module.exports = VersionHashInfo
}
