// Stop 1 LRO

const {ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const ArgLroId = require('./lib/concerns/ArgLroId')
const ArgNodeUrl = require('./lib/concerns/ArgNodeUrl')
const ArgWriteToken = require('./lib/concerns/ArgWriteToken')

class LROStop extends Utility {
  static blueprint() {
    return {
      concerns: [ArgLroId, ArgNodeUrl, ArgWriteToken, Client],
      options: [
        ModOpt('writeToken', {demand: true}),
        ModOpt('lroId', {
          demand: true,
          X: 'to stop'
        })
      ]
    }
  }

  async body() {
    await this.concerns.ArgWriteToken.argsProc()
    const {objectId, libraryId, writeToken, lroId} = this.args

    const client = await this.concerns.Client.get()

    // TODO: check first whether LRO is already terminated

    const {errors, warnings, logs} = await client.CallBitcodeMethod({
      objectId,
      libraryId,
      method: '/lro/stop',
      writeToken,
      constant: false,
      body: {lro_id: lroId}
    })

    this.logger.errorsAndWarnings({errors, warnings})
    if(logs && logs.length > 0) this.logger.logList('Log:', ...logs)
  }

  header() {
    return `Stop LRO: ${this.args.lroId} (write token: ${this.args.writeToken})`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(LROStop)
} else {
  module.exports = LROStop
}
