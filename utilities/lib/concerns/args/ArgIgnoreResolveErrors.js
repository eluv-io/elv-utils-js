// code related to --ignoreResolveErrors arg
'use strict'
const {NewOpt} = require('../../options.js')

const blueprint = {
  name: 'ArgIgnoreResolveErrors',
  options: [
    NewOpt('ignoreResolveErrors', {
      descTemplate: 'Ignore errors when resolving metadata links.',
      type: 'boolean',
      implies: 'resolveLinks'
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
