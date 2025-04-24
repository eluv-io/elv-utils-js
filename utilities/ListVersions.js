// List versions of an object
'use strict'
const {NewOpt} = require('./lib/options')

const Utility = require('./lib/Utility')

const WriteLocalFile = require('./lib/concerns/kits/WriteLocalFile.js')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const Version = require('./lib/concerns/libs/Version')


class ListVersions extends Utility {
  static blueprint() {
    return {
      concerns: [WriteLocalFile, ExistObj],
      options: [
        NewOpt('type', {
          descTemplate: 'include type of each version',
          type: 'boolean'
        }),
        NewOpt('commitTime', {
          descTemplate: 'include commit timestamp if available',
          type: 'boolean'
        }),
        NewOpt('commitMsg', {
          descTemplate: 'include commit message if available',
          type: 'boolean'
        }),
        NewOpt('decode', {
          descTemplate: 'include fields decoded from version hash',
          type: 'boolean'
        })
      ]
    }
  }

  async body() {
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()
    const {commitTime, commitMsg} = this.args
    const versionList = await this.concerns.ExistObj.versionList()

    for(let i = 0; i < versionList.length; i++) {
      const v = versionList[i]

      if(commitTime || commitMsg) {
        const commitInfo = await this.concerns.Metadata.commitInfo({
          libraryId,
          objectId,
          versionHash: v.hash
        })
        if(commitMsg) v.commit_message = commitInfo.message
        if(commitTime) v.commit_timestamp = commitInfo.timestamp
      }

      if(this.args.decode) {
        const decoded = Version.decode({versionHash: v.hash})
        v.decode_digest = decoded.digest
        v.decode_objectId = decoded.objectId
        v.decode_partHash = decoded.partHash
        v.decode_size = decoded.size
      }
    }

    this.logger.data('versions', versionList)
    this.logger.data('version_count', versionList.length)
    if(this.args.outfile) {
      if(this.args.json) {
        this.concerns.WriteLocalFile.writeJson({obj: versionList})
      } else {
        this.concerns.WriteLocalFile.writeTable({list: versionList})
      }
    } else {
      this.logger.logTable({list: versionList})
    }
  }

  header() {
    return `List versions for object ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(ListVersions)
} else {
  module.exports = ListVersions
}
