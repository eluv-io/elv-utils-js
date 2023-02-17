// Retrieve part list from object
const Utility = require('./lib/Utility')

const Draft = require('./lib/concerns/libs/Draft')
const {NewOpt} = require('./lib/options')

class WriteTokenInfo extends Utility {
  static blueprint() {
    return {
      concerns: [Draft],
      options: [
        NewOpt('writeToken', {
          demand: true,
          descTemplate: 'Write token to decode',
          type: 'string'
        }),
        NewOpt('nodeUrl', {
          descTemplate: 'Try to determine URL of node that generated the write token',
          type: 'boolean'
        })
      ]
    }
  }

  async body() {
    const {nodeUrl, writeToken} = this.args
    const result = this.concerns.Draft.decode({writeToken})

    if (nodeUrl) try {
      result.nodeUrl = await this.concerns.Draft.nodeURL({writeToken})
    } catch (e) {
      this.logger.warn(`Could not determine node URL for write token: ${e}`)
    }
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2))
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
