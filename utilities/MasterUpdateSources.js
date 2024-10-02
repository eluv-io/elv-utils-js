// Probe file in object for media structure
const clone = require('@eluvio/elv-js-helpers/Functional/clone')
const isEquivalent = require('@eluvio/elv-js-helpers/Boolean/isEquivalent')
const mergeRight = require('@eluvio/elv-js-helpers/Functional/mergeRight')

const {NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const CloudAccess = require('./lib/concerns/CloudAccess')
const ExistObj = require('./lib/concerns/kits/ExistObj')
const FabricFile = require('./lib/concerns/FabricFile.js')
const Metadata = require('./lib/concerns/Metadata')

class MasterUpdateSources extends Utility {
  static blueprint() {
    return {
      concerns: [Client, ExistObj, FabricFile, CloudAccess, Metadata],
      options: [
        NewOpt('files', {
          descTemplate: 'Filename(s) within object. If omitted, all files will be probed. Omit leading slashes (/)',
          string: true,
          type: 'array'
        })
      ]
    }
  }

  async body() {
    const {files} = this.args

    const access = this.concerns.CloudAccess.credentialSet(false)

    const {libraryId, objectId, versionHash} = await this.concerns.ExistObj.argsProc()

    // get production_master metadata
    const masterMetadata = await this.concerns.ExistObj.metadata({subtree: '/production_master'}) || {}
    const master = mergeRight({variants:{},sources:{}}, masterMetadata)
    const originalMaster = clone(master)

    // get list of files
    const client = await this.concerns.Client.get()
    //const fileInfo = await client.ListFiles({libraryId, objectId})
    const fileInfo = await this.concerns.FabricFile.fileList({libraryId, objectId, versionHash})
    // collect file paths and remove leading slashes
    const filePathList = fileInfo.map(x => x.path.slice(1))

    // validate --files
    if(files) {
      for(const file of files) {
        if(!filePathList.includes(file)) throw Error(`file '${file}' not found in object.`)
      }
    }

    const filesToScan = files || filePathList

    const successfulFiles = []
    for(const filePath of filesToScan) {
      this.logger.log(`Probing ${filePath}...`)
      const {data, errors, warnings} = await client.CallBitcodeMethod({
        objectId,
        libraryId,
        method: '/media/files/probe',
        constant: false, // needs to be a POST in case S3 credentials are needed
        body: {file_paths: [filePath], access}
      })
      this.logger.errorsAndWarnings({errors, warnings})
      if(Object.keys(data).includes(filePath)) successfulFiles.push(filePath)
      master.sources = mergeRight(master.sources, data)
    }

    // remove missing sources
    for(const source of Object.keys(master.sources)) {
      if(!filePathList.includes(source)) {
        this.logger.log(`Source '${source}' no longer exists, removing...`)
        delete master.sources[source]
      }
    }

    // basic validation of variant stream sources
    const validSources = Object.keys(master.sources)
    for(const [variantKey, variant] of Object.entries(master.variants)) {
      this.logger.log(`Checking streams in variant '${variantKey}'...`)
      for(const [streamKey, stream] of Object.entries(variant.streams)) {
        this.logger.log(`  Checking stream '${streamKey}'...`)
        for(const [sourceIndex, source] of stream.sources.entries()) {
          const filePath = source.files_api_path
          if(!validSources.includes(filePath)) {
            this.logger.warn(`    variant '${variantKey}' stream '${streamKey}' source ${sourceIndex} has invalid files_api_path: '${filePath}'`)
          } else {
            const sourceStreamCount = master.sources[filePath].streams.length
            if(source.stream_index >= sourceStreamCount) {
              this.logger.warn(`    variant '${variantKey}' stream '${streamKey}' source ${sourceIndex} has invalid stream_index: ${source.stream_index}`)
            }
          }
        }
      }
    }

    const newSources = []
    const removedSources = []
    const changedSources = []

    const originalSourceKeys = Object.keys(originalMaster.sources)
    const revisedSourceKeys = Object.keys(master.sources)

    for(const originalSourceKey of originalSourceKeys) {
      if(!revisedSourceKeys.includes(originalSourceKey)) removedSources.push(originalSourceKey)
    }
    for(const revisedSourceKey of revisedSourceKeys) {
      if(!originalSourceKeys.includes(revisedSourceKey)) {
        newSources.push(revisedSourceKey)
      } else if(!isEquivalent(
        originalMaster.sources[revisedSourceKey],
        master.sources[revisedSourceKey]
      )) {
        changedSources.push(revisedSourceKey)
      }
    }

    this.logger.log()
    this.logger.log(`Files probed: ${filesToScan.join(', ')}`)
    this.logger.log(`Files succeeded: ${successfulFiles.join(', ')}`)
    this.logger.log()
    this.logger.log(`Sources added: ${newSources.join(', ')}`)
    this.logger.log(`Sources removed: ${removedSources.join(', ')}`)
    this.logger.log(`Sources with changed media info: ${changedSources.join(', ')}`)
    this.logger.log()

    this.logger.log('Saving changes...')
    // write metadata back
    const newHash = await this.concerns.Metadata.write({
      commitMessage: 'Probe files and update /production_master/sources',
      libraryId,
      metadata: master,
      objectId,
      subtree: '/production_master'
    })

    this.logger.log(`New version hash: ${newHash}`)
  }

  header() {
    return `Probe media files in master and update sources metadata for object ID: ${this.args.objectId}` +
      (this.args.files ? ` (files: ${this.args.files.join(', ')})` : '')
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MasterUpdateSources)
} else {
  module.exports = MasterUpdateSources
}
