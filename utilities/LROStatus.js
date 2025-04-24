// Get detailed status info for 1 LRO
'use strict'

const {ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgLroId = require('./lib/concerns/ArgLroId')
const ArgNodeUrl = require('./lib/concerns/ArgNodeUrl')
const ArgWriteToken = require('./lib/concerns/args/ArgWriteToken')
const LRO = require('./lib/concerns/libs/LRO.js')

class LROStatus extends Utility {
  static blueprint() {
    return {
      concerns: [ArgLroId, ArgNodeUrl, ArgWriteToken, LRO],
      options: [
        ModOpt('writeToken', {demand: true}),
        ModOpt('lroId', {
          demand: true,
          X: 'to get status for'
        })
      ]
    }
  }

  async body() {
    await this.concerns.ArgWriteToken.argsProc()


    const {data, errors, warnings, logs} = await this.concerns.LRO.singleLroStatus(this.args)

    this.logger.errorsAndWarnings({errors, warnings})
    if(logs && logs.length > 0) this.logger.logList('Log:', logs)

    this.logger.data('lroStatusInfo', data)
    this.logger.log(data)
  }

  header() {
    return `Get status for LRO: ${this.args.lroId} (write token: ${this.args.writeToken})`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(LROStatus)
} else {
  module.exports = LROStatus
}
