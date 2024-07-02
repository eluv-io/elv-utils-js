// List all libraries visible to the current private key

//const {NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const AuthToken = require('./lib/concerns/libs/AuthToken')
const Logger = require('./lib/concerns/kits/Logger')

class AuthTokenGet extends Utility {
  static blueprint() {
    return {
      concerns: [AuthToken, Logger],
    }
  }

  async body() {
    const logger = this.logger
    const authToken = await this.concerns.AuthToken.getPlain()

    logger.data('authToken', authToken)
    logger.log(`Plain auth token: ${authToken}`)

  }

  header() {
    return 'Get a new plain auth token'
  }

}

if (require.main === module) {
  Utility.cmdLineInvoke(AuthTokenGet)
} else {
  module.exports = AuthTokenGet
}
