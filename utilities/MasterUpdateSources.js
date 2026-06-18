// Probe file in object for media structure
'use strict'
const clone = require('@eluvio/elv-js-helpers/Functional/clone')
const isEquivalent = require('@eluvio/elv-js-helpers/Boolean/isEquivalent')
const mergeRight = require('@eluvio/elv-js-helpers/Functional/mergeRight')

const {fabricItemDesc} = require('./lib/helpers')
const {NewOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const Client = require('./lib/concerns/Client')
const CloudAccess = require('./lib/concerns/kits/CloudAccess')
const ExistObjOrDft = require('./lib/concerns/kits/ExistObjOrDft')
const FabricFile = require('./lib/concerns/FabricFile.js')
const Metadata = require('./lib/concerns/libs/Metadata.js')
const Write = require('./lib/concerns/kits/Write')

class MasterUpdateSources extends Utility {
  static blueprint() {
    return {
      concerns: [Client, ExistObjOrDft, FabricFile, CloudAccess, Metadata, Write],
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
    const logger = this.logger

    const processedArgs = await this.concerns.ExistObjOrDft.argsProc()

    // create a write token if needed
    const writeInfo = await this.concerns.Write.prepare(processedArgs)

    const {
      commitMsg,
      files,
      finalize,
      libraryId,
      newDraftCreated,
      noFinalize,
      noWaitPublish,
      objectId,
      writeToken
    } = Object.assign(
      clone(processedArgs),
      writeInfo
    )

    const access = this.concerns.CloudAccess.remoteAccessList(false)

    // get production_master metadata
    const masterMetadata = await this.concerns.ExistObjOrDft.metadata({subtree: '/production_master'}) || {}
    const master = mergeRight({variants:{},sources:{}}, masterMetadata)
    const originalMaster = clone(master)

    // get list of files
    const client = await this.concerns.Client.get()
    const fileInfo = await this.concerns.FabricFile.fileList({libraryId, objectId, writeToken})
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
      logger.log(`Probing ${filePath}...`)
      const {data, errors, warnings} = await client.CallBitcodeMethod({
        objectId,
        libraryId,
        writeToken,
        method: '/media/files/probe',
        constant: false, // needs to be a POST in case S3 credentials are needed
        body: {file_paths: [filePath], access}
      })
      logger.errorsAndWarnings({errors, warnings})
      if(Object.keys(data).includes(filePath)) successfulFiles.push(filePath)
      master.sources = mergeRight(master.sources, data)
    }

    // remove missing sources
    for(const source of Object.keys(master.sources)) {
      if(!filePathList.includes(source)) {
        logger.log(`Source '${source}' no longer exists, removing...`)
        delete master.sources[source]
      }
    }

    // basic validation of variant stream sources
    const validSources = Object.keys(master.sources)
    for(const [variantKey, variant] of Object.entries(master.variants)) {
      logger.log(`Checking streams in variant '${variantKey}'...`)
      for(const [streamKey, stream] of Object.entries(variant.streams)) {
        logger.log(`  Checking stream '${streamKey}'...`)
        for(const [sourceIndex, source] of stream.sources.entries()) {
          const filePath = source.files_api_path
          if(!validSources.includes(filePath)) {
            logger.warn(`    variant '${variantKey}' stream '${streamKey}' source ${sourceIndex} has invalid files_api_path: '${filePath}'`)
          } else {
            const sourceStreamCount = master.sources[filePath].streams.length
            if(source.stream_index >= sourceStreamCount) {
              logger.warn(`    variant '${variantKey}' stream '${streamKey}' source ${sourceIndex} has invalid stream_index: ${source.stream_index}`)
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

    logger.log()
    logger.log(`Files probed: ${filesToScan.join(', ')}`)
    logger.log(`Files succeeded: ${successfulFiles.join(', ')}`)
    logger.log()
    logger.log(`Sources added: ${newSources.join(', ')}`)
    logger.log(`Sources removed: ${removedSources.join(', ')}`)
    logger.log(`Sources with changed media info: ${changedSources.join(', ')}`)
    logger.log()

    logger.log('Saving changes...')

    // write metadata back
    await this.concerns.Metadata.write({
      libraryId,
      metadata: master,
      objectId,
      subtree: '/production_master',
      writeToken
    })

    await this.concerns.Write.conclude({
      commitMsg,
      defaultCommitMsg: 'MasterUpdateSources.js - probe master source file(s) and update metadata: /production_master',
      finalize,
      libraryId,
      newDraftCreated,
      noFinalize,
      noWaitPublish,
      objectId,
      writeToken
    })
  }

  header() {
    return `Probe media files in master and update sources metadata for ${fabricItemDesc(this.args)}` +
      (this.args.files ? ` (files: ${this.args.files.join(', ')})` : '')
  }
}

if(require.main === module) {
  Utility.cmdLineInvoke(MasterUpdateSources)
} else {
  module.exports = MasterUpdateSources
}
