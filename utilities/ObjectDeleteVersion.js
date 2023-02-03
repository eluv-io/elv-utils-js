// Retrieve part list from object
const Utility = require('./lib/Utility')

const ExistVer = require('./lib/concerns/ExistVer')

class ObjectDeleteVersion extends Utility {
  blueprint() {
    return {
      concerns: [ExistVer]
    }
  }

  async body() {
    await this.concerns.ExistVer.del()
  }

  header() {
    return `Delete version ${this.args.versionHash}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(ObjectDeleteVersion)
} else {
  module.exports = ObjectDeleteVersion
}
