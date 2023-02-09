/* eslint-disable no-console */

// A logger dedicated to local debugging, with redacted output.
// Used primarily for debugging config processing

const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')
const FunctionModel = require('@eluvio/elv-js-helpers/Model/FunctionModel')
const redact = require('@eluvio/elv-js-helpers/Conversion/redact')

const debug = console.debug

const debugJson = x => console.debug(JSON.stringify(redact(x),null,2))

const DebugLoggerModel = defObjectModel('DebugLogger', {
  debug: FunctionModel,
  debugJson: FunctionModel,
  group: FunctionModel,
  groupEnd: FunctionModel,
})

const group = (...args) => {
  const combined = args.join(' ')
  const dashCount = combined.length > 70 ? 70 : combined.length
  debug()
  debug('='.repeat(dashCount))
  debug(combined)
  debug('='.repeat(dashCount))
  debug()
  console.group()
}

const groupEnd = console.groupEnd

module.exports = {
  debug,
  debugJson,
  DebugLoggerModel,
  group,
  groupEnd
}
