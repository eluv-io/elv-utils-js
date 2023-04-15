// Start a draft on an existing object

const Utility = require('./lib/Utility')

const ArgCommitMsg = require('./lib/concerns/args/ArgCommitMsg')
const ExistDft = require('./lib/concerns/kits/ExistDft')

class DraftFinalize extends Utility {
  static blueprint() {
    return {
      concerns: [ExistDft, ArgCommitMsg],
      options: [

      ]
    }
  }

  async body() {
    const logger = this.logger

    // operations that may need to wait on network access
    // ----------------------------------------------------
    const {libraryId, objectId, writeToken} = await this.concerns.ExistDft.argsProc()
    const {commitMsg} = this.args
    logger.log('Finalizing...')

    const result = await this.concerns.ExistDft.finalize(
      {
        commitMsg,
        libraryId,
        objectId,
        writeToken
      }
    )
    logger.data('versionHash', result)

    logger.log()
    logger.log(`New version hash: ${result}`)
  }

  header() {
    return `Finalize draft ${this.args.writeToken}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(DraftFinalize)
} else {
  module.exports = DraftFinalize
}
