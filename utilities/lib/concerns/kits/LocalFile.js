// code related to adding local files to fabric
'use strict'
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

const {absPath} = require('../../helpers')

const FabricFilesAdd = require('./FabricFilesAdd.js')
const Client = require('../Client')
const FabricFile = require('../libs/FabricFile')
const Logger = require('./Logger')

const blueprint = {
  name: 'LocalFile',
  concerns: [FabricFilesAdd, FabricFile, Logger, Client]
}

const New = context => {

  const add = async ({
    libraryId,
    objectId,
    writeToken
  }) => {
    const {storeClear} = context.args

    let fileHandles = []
    const fInfo = fileInfo(fileHandles)

    await context.concerns.FabricFile.add(
      {
        encrypt: !storeClear,
        fileInfo: fInfo,
        libraryId,
        objectId,
        writeToken
      })
    // Close file handles
    closeFileHandles(fileHandles)
  }

  const callback = progress => {
    Object.keys(progress).sort().forEach(filename => {
      const {uploaded, total} = progress[filename]
      const percentage = total === 0 ? '100.0%' : (100 * uploaded / total).toFixed(1) + '%'
      context.concerns.Logger.log(`${filename}: ${percentage}`)
    })
  }

  const closeFileHandles = fileHandles => fileHandles.forEach(descriptor => fs.closeSync(descriptor))

  const fileInfo = (fileHandles) => {
    const {destDir, files} = context.args
    return files.map(sourcePath => {
      const fullSourcePath = absPath(sourcePath, context.cwd)
      const fileDescriptor = fs.openSync(fullSourcePath, 'r')
      fileHandles.push(fileDescriptor)
      const size = fs.fstatSync(fileDescriptor).size
      const mimeType = mime.lookup(fullSourcePath) || 'video/mp4'
      const destPath = (destDir ? destDir + '/' : '') + path.basename(sourcePath)
      return {
        fullPath: fullSourcePath,
        path: destPath,
        type: 'file',
        mime_type: mimeType,
        size: size,
        data: fileDescriptor
      }
    })
  }

  return {
    add,
    callback,
    closeFileHandles,
    fileInfo
  }
}

module.exports = {
  blueprint,
  New
}
