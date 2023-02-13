// Get content type for a library, object, version, or draft

const Utility = require('./lib/Utility')
const {fabricItemDesc} = require('./lib/helpers')

const ContentType = require('./lib/concerns/ContentType')
const ExistLibOrObjOrVerOrDft = require('./lib/concerns/kits/ExistLibOrObjOrVerOrDft')
const Logger = require('./lib/concerns/Logger')

class ObjectSetType extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ExistLibOrObjOrVerOrDft, ContentType],
    }
  }

  async body() {
    const logger = this.concerns.Logger
    const {libraryId, objectId, versionHash, writeToken} = await this.concerns.ExistLibOrObjOrVerOrDft.argsProc()

    const typeRef = await this.concerns.ExistLibOrObjOrVerOrDft.typeHash({libraryId, objectId, versionHash, writeToken})

    if (typeRef === '') {
      logger.warn(`No type found for ${fabricItemDesc(this.args)}`)
      logger.data('type', null)
    } else {
      let typeDetails = {}
      try {
        typeDetails = await this.concerns.ContentType.get({typeRef})
      } catch (e) {
        logger.warn(`Could not get details for Content Type ${typeRef}: ${e}`)
      }
      const result = {
        name: typeDetails?.name,
        objectId: typeDetails?.id,
        versionHash: typeRef,
      }

      logger.data('type', result)
      logger.logObject(result)
    }
  }

  header() {
    return `Get content type for ${fabricItemDesc(this.args)}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(ObjectSetType)
} else {
  module.exports = ObjectSetType
}
