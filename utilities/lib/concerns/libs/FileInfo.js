// code related to fileInfo argument for elv-client-js file upload calls
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

const flatten = require('@eluvio/elv-js-helpers/Functional/flatten')

const {absPath} = require('../../helpers')

const Logger = require('../Logger')

const blueprint = {
  name: 'FileInfo',
  concerns: [Logger]
}

const New = context => {
  const logger = context.concerns.Logger

  const get = (paths, localPathPrefix, fabricDestDir) => {
    return flatten(paths.map(filePath => {
      const fullPath = absPath(filePath, localPathPrefix || context.cwd)
      const stat = fs.lstatSync(fullPath)
      const basename = path.basename(fullPath)
      // skip hidden items for now
      if (!basename.startsWith('.')) {
        // is this a directory?
        if (stat.isFile()) {
          const fileDescriptor = fs.openSync(fullPath, 'r')
          const size = fs.fstatSync(fileDescriptor).size
          const mimeType = mime.lookup(fullPath) || 'video/mp4'

          const fabricPath = fabricDestDir ? [fabricDestDir, basename].join('/') : basename
          return {
            path: fabricPath,
            type: 'file',
            mime_type: mimeType,
            size: size,
            data: fileDescriptor
          }
        } else if (stat.isDirectory()) {
          const fabricDestSubdir = fabricDestDir ? [fabricDestDir, basename].join('/') : basename
          const dirItems = fs.readdirSync(fullPath)
          return get(dirItems, fullPath, fabricDestSubdir)
        } else {
          throw Error(`'${fullPath}' is not a file or directory`)
        }
      } else {
        return null
      }
    })).filter(x => x) // remove undefined/null
  }
  return {
    get
  }
}

module.exports = {
  blueprint,
  New
}

