// code related to --clear-multipliers arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgClearMultipliers',
  options: [
    NewOpt('clearMultipliers', {
      descTemplate: 'Clear any multiplier values in stream \'sources\' list',
      type: 'boolean',
      conflicts: 'multipliers'
    })
  ]
}


// eslint-disable-next-line no-unused-vars
const New = context => {
  return {}
}

module.exports = {
  blueprint,
  New
}
