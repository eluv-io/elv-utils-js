// code related to --noFinalize arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgNoFinalize',
  options: [
    NewOpt('noFinalize', {
      descTemplate: 'Leave draft unfinalized after creating/editing',
      type: 'boolean',
      conflicts: ['finalize', 'commitMsg']
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
