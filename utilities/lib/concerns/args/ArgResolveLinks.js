// code related to --resolveLinks arg
'use strict'
const {NewOpt} = require('../../options.js')

const blueprint = {
  name: 'ArgResolveLinks',
  options: [
    NewOpt('resolveLinks', {
      descTemplate: 'Resolve metadata links.',
      type: 'boolean'
    })
  ]
}

// eslint-disable-next-line no-unused-vars
const New = context => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  New
}
