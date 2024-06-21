// code related to --variantKey
const {NewOpt} = require('../../options')

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

// eslint-disable-next-line no-unused-vars
const New = context => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  New
}
