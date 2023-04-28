// Edit an existing stream in an existing variant
const JSON = require('./lib/concerns/JSON')

const isNumber = require('@eluvio/elv-js-helpers/Boolean/isNumber')
const NonNegativeIntModel = require('@eluvio/elv-js-helpers/Model/NonNegativeIntModel')

const {HDRInfoModel} = require('./lib/models/HDRInfoModel')
const {MasterSourcesModel} = require('./lib/models/Master')

const Utility = require('./lib/Utility')
const {NewOpt} = require('./lib/options')

const Edit = require('./lib/concerns/Edit')
const ExistObj = require('./lib/concerns/kits/ExistObj')

class MasterAddHDRInfo extends Utility {
  static blueprint() {
    return {
      concerns: [ExistObj, Edit, JSON],
      options: [
        NewOpt('file', {
          descTemplate: 'File within master object that contains HDR video stream',
          type: 'string',
          demand: true
        }),
        NewOpt('info', {
          descTemplate: 'Either a JSON string for HDR info, or the path to a JSON file containing the info',
          type: 'string',
          demand: true,
          coerce: HDRInfoModel
        }),
        NewOpt('streamIndex', {
          descTemplate: 'Numeric index (0 = first stream) of video stream. (If omitted, HDR info will be added to the first video stream found in file)',
          type: 'number',
          coerce: NonNegativeIntModel
        })
      ]
    }
  }

  async body() {
    const {libraryId, objectId} = await this.concerns.ExistObj.argsProc()

    const {file, info, streamIndex} = this.args
    const hdrInfo = this.concerns.JSON.parseStringOrFile({strOrPath: info})

    // get production_master metadata
    const sources = await this.concerns.ExistObj.metadata({subtree: '/production_master/sources'})

    // validate
    MasterSourcesModel(sources)
    if (!sources[file])  throw Error(`/production_master/sources/${file}/ not found in metadata`)

    let videoStreamIndex
    const streams = sources[file].streams
    if (isNumber(streamIndex)) {
      if (streamIndex >= streams.length) throw Error(`--streamIndex too large (max stream index for ${file} is ${streams.length - 1}`)
      if (streams[streamIndex].type !== 'StreamVideo') throw Error('--streamIndex points to a stream that is not video')
      videoStreamIndex = streamIndex
    } else {
      for (let i = 0; i < streams.length; i++) {
        if (streams[i].type === 'StreamVideo') {
          videoStreamIndex = i
          break
        }
      }
    }

    if (!isNumber(videoStreamIndex)) throw Error(`No video stream found in /production_master/sources/${file}`)
    sources[file].streams[videoStreamIndex].hdr = hdrInfo

    this.logger.log('Saving changes...')

    // write metadata back
    const newHash = await this.concerns.Metadata.write({
      commitMessage: `Add HDR info to sources metadata for ${file} (stream index: ${videoStreamIndex})`,
      libraryId,
      metadata: sources,
      objectId,
      subtree: '/production_master/sources'
    })

    this.logger.log(`New version hash: ${newHash}`)
  }

  header() {
    return `Add HDR info to metadata for source file '${this.args.file}' of production master: ${this.args.objectId}`
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MasterAddHDRInfo)
} else {
  module.exports = MasterAddHDRInfo
}
