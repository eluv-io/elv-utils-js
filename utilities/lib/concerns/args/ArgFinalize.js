// code related to --finalize arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgFinalize',
  options: [
    NewOpt('finalize', {
      descTemplate: 'Finalize draft specified by --writeToken',
      type: 'boolean',
      implies: 'writeToken',
      conflicts: 'noFinalize'
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
