// code related to loading / parsing JSON
'use strict'
const {JSONPath} = require('jsonpath-plus')

const {ellipsize, readFile, stringOrFileContents} = require('../../helpers')

const Logger = require('../kits/Logger')

const blueprint = {
  name: 'ProcessJSON',
  concerns: [Logger]
}

const jPath = ({pattern, metadata}) => {
  return JSONPath({
    json: metadata,
    path: pattern,
    wrap: false
  })
}

const shortString = ({obj, width=30}) => ellipsize(JSON.stringify(obj),width)


const New = (context) => {
  const logger = context.concerns.Logger
  const cwd = context.cwd

  const parseFile = ({path}) => parseString({
    str: readFile(path, cwd, logger)
  })

  const parseString = ({str}) => {
    let parsed
    try {
      parsed = JSON.parse(str)
    } catch(e) {
      logger.error('Failed to parse JSON')
      throw e
    }
    return parsed
  }

  const parseStringOrFile = ({strOrPath}) => {
    console.log(strOrPath)
    try {
      return parseString({
        str: stringOrFileContents(strOrPath, cwd, logger)
      })
    } catch (e) {
      throw Error(`could not interpret '${strOrPath}' as file path or JSON string`)
    }
  }

  return {
    parseFile,
    parseString,
    parseStringOrFile,
    shortString
  }
}

module.exports = {
  blueprint,
  jPath,
  New,
  shortString
}
