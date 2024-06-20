// List all content types visible to the current private key

const Utility = require('./lib/Utility')

const ContentType = require('./lib/concerns/ContentType')
const Logger = require('./lib/concerns/Logger')

class ListTypes extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ContentType],
      options: []
    }
  }

  async body() {
    const logger = this.logger
    const typeList = await this.concerns.ContentType.list()
    logger.data('contentTypes', typeList)
    logger.logTable({list: typeList})
    if(typeList.length === 0) logger.warn('No visible content types found using supplied private key.')
  }

  header() {
    return 'Get list of content types'
  }

}

if(require.main === module) {
  Utility.cmdLineInvoke(ListTypes)
} else {
  module.exports = ListTypes
}
