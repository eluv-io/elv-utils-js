// code related to --file arg
'use strict'
const fs = require('fs')

const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const {NewOpt} = require('../../options')
const {absPath} = require('../../helpers.js')

const Logger = require('../kits/Logger.js')

const blueprint = {
  name: 'ArgFile',
  concerns: [Logger],
  options: [
    NewOpt('file', {
      descTemplate: 'Path to{X} file',
      coerce: NonBlankStrModel,
      type: 'string'
    })
  ]
}

const New = context => {
  const logger = context.concerns.Logger

  const read = () => {
    const filePath = context.args.file
    if (!filePath) throw Error('ArgFile.read() - missing --file')
    const fullPath = absPath(filePath, context.cwd)
    if (!fs.existsSync(fullPath)) {
      throw Error(`File '${fullPath}' not found.`)
    }
    logger.log(`Reading ${fullPath}...`)
    return fs.readFileSync(fullPath)
  }

  // instance interface
  return {
    read
  }
}

module.exports = {
  blueprint,
  New
}
