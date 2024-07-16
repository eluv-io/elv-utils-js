// code related to --variantKey
const {NewOpt} = require('../options')

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
