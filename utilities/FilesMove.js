// Move/rename files within a fabric object
const defNonEmptyArrModel = require('@eluvio/elv-js-helpers/ModelFactory/defNonEmptyArrModel')

const {NewOpt} = require('./lib/options')
const {fabricItemDesc} = require('./lib/helpers')
const FabricFilePathModel = require('./lib/models/FabricFilePathModel')

const Utility = require('./lib/Utility')

const ExistObjOrDft = require('./lib/concerns/kits/ExistObjOrDft')
const Edit = require('./lib/concerns/Edit')
const FabricFile = require('./lib/concerns/FabricFile')
const Logger = require('./lib/concerns/Logger')

class FilesAdd extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, ExistObjOrDft, Edit, FabricFile],
      options: [
        NewOpt('sources', {
          descTemplate: 'full paths of files and/or directories to move',
          demand: true,
          string: true,
          type: 'array',
          coerce: defNonEmptyArrModel('sources', FabricFilePathModel)
        }),
        NewOpt('dest', {
          descTemplate: 'Full destination path',
          demand: true,
          type: 'string',
          coerce: FabricFilePathModel
        })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {sources, dest} = this.args

    const {libraryId, objectId, writeToken} = await this.concerns.ExistObjOrDft.argsProc()

    const actualWriteToken = writeToken || (await this.concerns.Edit.getWriteToken({
      libraryId,
      objectId
    })).writeToken

    this.concerns.FabricFile.move({
      dest,
      libraryId,
      objectId,
      sources,
      writeToken: actualWriteToken
    })

    if (!writeToken) {
      const hash = await this.concerns.Edit.finalize({
        commitMessage: 'Move/rename file(s)',
        libraryId,
        objectId,
        writeToken: actualWriteToken
      })
      logger.log(`New version hash: ${hash}`)
      logger.data('version_hash', hash)
    } else {
      logger.log(`Draft left unfinalized, write token: ${writeToken}`)
    }
  }

  header() {
    return `Move/rename files and/or directories in ${fabricItemDesc(this.args)}`
  }
}

//
// if (require.main === module) {
//   Utility.cmdLineInvoke(FilesAdd)
// } else {
//   module.exports = FilesAdd
// }


const script = new FilesAdd({
  argList: [
    '--sources', '/dist/temp.json',
    '--dest', '/temp2.json',
    '--configUrl', 'http://localhost:8008/config?qspace=dev&self',
    '--objectId', 'iq__3iZT9igGZxjmnnRHt216PpMXBHC5'
  ],
  env: {
    'PRIVATE_KEY': '0x45e758fd007d151b4eef4d0b6e6791f83bea3d6e2ad21aee61001034eed58be5'
  }
})
script.run()