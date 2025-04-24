// code related to --fabricVersion arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgFabricVersion',
  options: [
    NewOpt('fabricVersion', {
      descTemplate: 'Include fabric version',
      type: 'boolean'
    })
  ]
}

const New = () => {

  return {}
}

module.exports = {
  blueprint,
  New
}
