// Retrieve part list from object
'use strict'
const Utility = require('./lib/Utility')

const {fabricItemDesc} = require('./lib/helpers.js')

const ExistObjOrVerOrDft = require('./lib/concerns/kits/ExistObjOrVerOrDft')
const ArgOfferingKey = require('./lib/concerns/args/ArgOfferingKey')
const ArgOutfile = require('./lib/concerns/args/ArgOutfile')
const ArgStreamKey = require('./lib/concerns/args/ArgStreamKey')
const Offering = require('./lib/concerns/libs/Offering.js')

class OfferingStreamPartHashes extends Utility {
  static blueprint() {
    return {
      concerns: [ArgOfferingKey, ArgOutfile, ArgStreamKey, ExistObjOrVerOrDft]
    }
  }

  async body() {
    const {libraryId, objectId, versionHash, writeToken} = await this.concerns.ExistLibOrObjOrVerOrDft.argsProc()
    const {offeringKey, outfile, streamKey} = this.args

    this.logger.log(`Retrieving offering '${offeringKey}'`)
    const offering = await this.concerns.ExistObjOrVerOrDft.metadata({
      libraryId,
      objectId,
      resolveLinks: true,
      subtree: `/offerings/${offeringKey}`,
      versionHash,
      writeToken
    })




    if(outfile) {
      this.concerns.ArgOutfile.writeJson(partList)
    } else {
      this.logger.logTable({list: partList})
    }

    if(partList.length === 0) this.logger.warn('No parts found.')
  }

  header() {
    return `Get part hashes of stream '${this.args.streamKey}' in offering '${this.args.offeringKey}' from ${fabricItemDesc(this.args)}...`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(OfferingStreamPartHashes)
} else {
  module.exports = OfferingStreamPartHashes
}
