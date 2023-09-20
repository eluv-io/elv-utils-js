// code related to opening local files (generally for upload to fabric)
const fs = require('fs')

const {StdOpt} = require('../options')

const Client = require('./Client')
const Logger = require('./Logger')
const FileInfo = require('./libs/FileInfo')

const blueprint = {
  name: 'LocalFile',
  concerns: [Logger, Client, FileInfo],
  options: [
    StdOpt('files', {demand: true}),
  ]
}

const New = context => {

  const add = async ({libraryId, objectId, writeToken, fileInfo, encrypt}) => {
    const client = await context.concerns.Client.get()
    await client.UploadFiles({
      libraryId,
      objectId,
      writeToken,
      fileInfo,
      callback,
      encryption: encrypt ? 'cgck' : 'none'
    })
  }

  const callback = progress => {
    Object.keys(progress).sort().forEach(filename => {
      const {uploaded, total} = progress[filename]
      const percentage = total === 0 ? '100.0%' : (100 * uploaded / total).toFixed(1) + '%'
      context.concerns.Logger.log(`${filename}: ${percentage}`)
    })
  }

  const closeFileHandles = fileHandles => fileHandles.forEach(descriptor => fs.closeSync(descriptor))

  const fileInfo = () => {
    return context.concerns.FileInfo.get(context.args.files)
  }

  return {add, callback, closeFileHandles, fileInfo}
}

module.exports = {blueprint, New}
