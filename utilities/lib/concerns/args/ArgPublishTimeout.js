// code related to --publishTimeout
'use strict'
const PositiveIntModel = require('@eluvio/elv-js-helpers/Model/PositiveIntModel')

const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgPublishTimeout',
  options: [
    NewOpt('publishTimeout', {
      descTemplate: 'Max number of seconds to wait for a new finalized version to be published before exiting with an error (ignored if not finalizing)',
      type: 'number',
      coerce: PositiveIntModel,
      default: 600
    })
  ]
}

const New = () => {
  // instance interface
  return {}
}

module.exports = {
  blueprint,
  New
}
