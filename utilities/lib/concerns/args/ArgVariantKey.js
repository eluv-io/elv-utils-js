// code related to --variantKey
'use strict'
const {NewOpt} = require('../../options.js')

const blueprint = {
  name: 'ArgVariantKey',
  options: [
    NewOpt('variantKey', {
      default: 'default',
      descTemplate: 'Key for the production master variant{X}',
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
