// code related to --nodeUrl
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgNodeUrl',
  implies: 'writeToken',
  options: [
    NewOpt('nodeUrl', {
      descTemplate: 'URL of node that generated write token',
      type: 'string'
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
