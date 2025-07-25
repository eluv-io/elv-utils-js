// code related to --name arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgName',
  options: [
    NewOpt('name', {
      descTemplate: 'Name{X}',
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