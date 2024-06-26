// Add-on for scripts that do logging
// (This concern is automatically added by Utility.js to all utility scripts)

const util = require('util')

const columnify = require('columnify')

const identity = require('@eluvio/elv-js-helpers/Functional/identity')
const isEquivalent = require('@eluvio/elv-js-helpers/Boolean/isEquivalent')
const map = require('@eluvio/elv-js-helpers/Functional/map')
const mergeDeepRight = require('@eluvio/elv-js-helpers/Functional/mergeDeepRight')
const now = require('@eluvio/elv-js-helpers/Datetime/now')
const setArity = require('@eluvio/elv-js-helpers/Functional/setArity')

const {NewOpt} = require('../options')

const blueprint = {
  name: 'Logger',
  options: [
    NewOpt('json', {
      descTemplate: 'Output results in JSON format',
      group: 'Logger',
      type: 'boolean'
    }),

    NewOpt('silent', {
      descTemplate: 'Suppress logging to stdout',
      group: 'Logger',
      type: 'boolean'
    }),

    NewOpt('timestamps', {
      alias: 'ts',
      descTemplate: 'Prefix messages with timestamps',
      group: 'Logger',
      type: 'boolean'
    }),

    NewOpt('verbose', {
      descTemplate: 'Print more information on errors',
      group: 'Logger',
      type: 'boolean'
    })
  ]
}

const New = (context) => {
  // -------------------------------------
  // closures
  // -------------------------------------
  const {json, silent, timestamps, verbose} = context.args
  const output = {
    data: {},
    errors: [],
    log: [],
    warnings: []
  }

  // -------------------------------------
  // private utility methods
  // -------------------------------------

  // add timestamp prefix to args if specified (and message is not just a blank line)
  const argsWithPrefix = list => timestamps && !isBlankMessage(list)
    ? [now().toISOString()].concat(list)
    : list

  // attempt to provide more helpful messages for objects
  const format = (...args) => {
    const prefix = timestamps ? args.shift() + ' ' : ''

    const item = (args.length === 1 ? args[0] : prefix + util.format(...args))
    if (item?.name === 'ElvHttpClientError') return formatElvHttpClientError(item)
    let details = []
    if (Object.keys(item).includes('message')) {
      details.push(`${prefix}${item.message}`)
    }
    if (verbose && Object.keys(item).includes('stack')) {
      details.push(prefix + item.stack)
    }
    if (Object.keys(item).includes('body')) {
      if (verbose) {
        details.push(prefix + JSON.stringify(item.body, null, 2))
      } else {
        details.push((prefix + JSON.stringify(item.body, null, 2)).split('\n').slice(0, 4))
      }

    }
    if (details.length > 0) {
      return details.join('\n')
    }
    return prefix + item
  }

  const formatElvHttpClientError = err => {
    if (err.body?.errors && err.body?.errors.length > 0) {
      return err.body.errors.map(e => e.kind ? e.kind : `${e}`).join('\n')
    }
    if (err.body) return JSON.stringify(err.body)
    if (err.message) return err.message
    return `${err}`
  }

  const isBlankMessage = (list) => isEquivalent(list, ['']) || isEquivalent(list, [])

  // save non-data items to json output
  const jsonConsole = (key, ...args) => {
    if (!isBlankMessage(args)) { // omit empty messages used for whitespace
      output[key].push(format(...args))
    }
  }


  // -------------------------------------
  // interface: console
  // -------------------------------------

  const debug = (...args) => {
    args = argsWithPrefix(args)
    if (json) {
      jsonConsole('debug', ...args)
    } else {
      // eslint-disable-next-line no-console
      if (!silent) console.debug(...args)
    }
  }

  // log error and send to node.js Console or json output object
  const error = (...args) => {
    args = argsWithPrefix(args)
    if (json) {
      jsonConsole('errors', ...args)
    } else {
      // eslint-disable-next-line no-console
      if (!silent) console.error(format(...args))
    }
  }

  // log message and send to node.js Console or json output object
  const log = (...args) => {
    args = argsWithPrefix(args)
    if (json) {
      jsonConsole('log', ...args)
    } else {
      // eslint-disable-next-line no-console
      if (!silent) console.log(...args)
    }
  }

  // log warning and send to node.js Console or json output object
  const warn = (...args) => {
    args = argsWithPrefix(args)
    if (json) {
      jsonConsole('warnings', ...args)
    } else {
      // eslint-disable-next-line no-console
      if (!silent) console.warn(...args)
    }
  }

  // -------------------------------------
  // interface: Logger
  // -------------------------------------

  const allInfoGet = () => output

  const args = (obj) => output.args = obj

  // set/replace data for a a key in JSON output @ /data/(key)/
  const data = (key, obj) => output.data[key] = obj

  // set/concat data for a a key in JSON output @ /data/(key)/
  const dataConcat = (key, obj) => {
    if (output.data[key]) {
      output.data[key] = output.data[key].concat(obj)
    } else {
      output.data[key] = obj
    }
  }

  const dataGet = () => output && output.data

  const errorList = (...args) => map(setArity(1,  error), args)

  const errorsAndWarnings = ({errors = [], warnings = []}) => {
    if (warnings.length) {
      log('Warnings:')
      warnList(...warnings)
      log()
    }
    if (errors.length > 0) {
      log('Errors:')
      errorList(...errors)
      log()
    }
  }

  const exitCode = (code) => output.exitCode = code

  const failureReason = val => output.failureReason = val

  const logList = (...args) => {
    // if there is more than one arg, and some are lists, unwrap them into top level of list
    const list = args.flat(1)
    list.forEach(item => log(item))
  }

  const logObject = obj => {
    const lines = JSON.stringify(obj, null, 2).split('\n')
    lines.forEach(line => log(line))
  }

  // formats a list of objects in tabular format
  const logTable = ({list, options = {}}) => {
    const mergedOptions = mergeDeepRight(
      {headingTransform: identity},
      options
    )
    logList(
      '',
      ...columnify(list, mergedOptions).split('\n'),
      ''
    )
  }

  // print out json output object (if configured)
  const outputJSON = () => {
    if (json) {
      const lines = JSON.stringify(output, null, 2).split('\n')
      // eslint-disable-next-line no-console
      if (!silent) lines.forEach(x => console.log(x))
    }
  }

  const successValue = val => output.successValue = val

  const warnList = (...args) => map(setArity(1, warn), args)

  // instance interface
  return {
    allInfoGet,
    args,
    data,
    dataConcat,
    dataGet,
    debug,
    error,
    errorList,
    errorsAndWarnings,
    exitCode,
    failureReason,
    log,
    logList,
    logObject,
    logTable,
    outputJSON,
    successValue,
    warn,
    warnList
  }
}

module.exports = {
  blueprint,
  New
}
