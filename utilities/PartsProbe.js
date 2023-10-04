// Probe part in object for media structure

const {fabricItemDesc} = require('./lib/helpers')

const {NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgOutfile = require('./lib/concerns/ArgOutfile')
const Client = require('./lib/concerns/Client')
const ExistObjOrVerOrDft = require('./lib/concerns/kits/ExistObjOrVerOrDft')
const Part = require('./lib/concerns/Part')

class PartsProbe extends Utility {
  static blueprint() {
    return {
      concerns: [Client, ExistObjOrVerOrDft, ArgOutfile, Part],
      options: [
        NewOpt('partHashes', {
          demand: true,
          descTemplate: 'Part(s) to probe',
          string: true,
          type: 'array'
        })
      ]
    }
  }

  async body() {
    const {partHashes, outfile} = this.args
    const client = await this.concerns.Client.get()

    const {libraryId, objectId, versionHash, writeToken} = await this.concerns.ExistObjOrVerOrDft.argsProc()

    // generate auth token manually as ElvClient.CallBitcodeMethod() generates a token unsuitable for GET + /call/
    const headers = {
      Authorization: (
        await client.authClient.AuthorizationHeader({
          libraryId,
          objectId,
          writeToken
        })
      ).Authorization
    }

    const result = {}
    for(const partHash of partHashes) {
      this.logger.log(`Probing ${partHash}...`)
      const {data, errors, warnings} = await client.CallBitcodeMethod({
        libraryId,
        objectId,
        versionHash,
        writeToken,
        headers,
        method: `/media/parts/${partHash}/probe`,
        constant: true
      })
      result[partHash] = {data, errors, warnings}
      this.logger.errorsAndWarnings({errors, warnings})
    }

    if(outfile) {
      this.concerns.ArgOutfile.writeJson(result)
    } else {
      this.logger.logObject(result)
    }
    this.logger.data('partMediaInfo', result)

  }

  header() {
    return `Get media info for part(s) in ${fabricItemDesc(this.args)}...`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(PartsProbe)
} else {
  module.exports = PartsProbe
}
