// code related to --timeShift
'use strict'
const NumberModel = require('@eluvio/elv-js-helpers/Model/NumberModel')

const {NewOpt} = require('../../options.js')

const blueprint = {
  name: 'ArgTimeShift',
  options: [
    NewOpt('timeShift', {
      descTemplate: 'Number of seconds to add or (-) subtract{X}',
      coerce: NumberModel,
      type: 'number'
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
