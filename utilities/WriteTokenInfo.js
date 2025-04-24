// Retrieve information about a Draft
'use strict'
const Utility = require('./lib/Utility')
const {ModOpt} = require('./lib/options')

const ArgWriteToken = require('./lib/concerns/args/ArgWriteToken')
const Draft = require('./lib/concerns/libs/Draft')

class WriteTokenInfo extends Utility {
  static blueprint() {
    return {
      concerns: [ArgWriteToken, Draft],
      options: [
        ModOpt('writeToken', {
          demand: true,
          descTemplate: 'Write token to decode'
        })
      ]
    }
  }

  async body() {
    const {writeToken} = this.args
    const result = this.concerns.Draft.decode({writeToken})

    try {
      result.nodeUrl = await this.concerns.Draft.nodeURL({writeToken})
    } catch (e) {
      this.logger.warn(`Could not determine node URL for write token: ${e}`)
    }
    this.logger.data('writeTokenInfo', result)
    this.logger.log(JSON.stringify(result, null, 2))
  }

  header() {
    return `Print info for write token ${this.args.writeToken}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(WriteTokenInfo)
} else {
  module.exports = WriteTokenInfo
}
