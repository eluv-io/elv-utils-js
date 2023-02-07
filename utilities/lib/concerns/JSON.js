// code related to loading / parsing JSON
const {JSONPath} = require('jsonpath-plus')

const {ellipsize, readFile, stringOrFileContents} = require('../helpers')

const Logger = require('./Logger')

const blueprint = {
  name: 'JSON',
  concerns: [Logger]
}

// prevent loss of access to built-in JSON methods
// when a file includes "const JSON = require("concerns/JSON");"
const parse = JSON.parse
const stringify = JSON.stringify

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
    try {
      return parseString({
        str: stringOrFileContents(strOrPath, cwd, logger)
      })
    } catch (e) {
      throw Error(`could not interpret '${strOrPath}' as file path or JSON string`)
    }
  }

  return {
    parse,
    parseFile,
    parseString,
    parseStringOrFile,
    shortString,
    stringify
  }
}

module.exports = {
  blueprint,
  jPath,
  New,
  parse,
  shortString,
  stringify
}
