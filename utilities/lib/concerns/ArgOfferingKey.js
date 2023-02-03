// code related to --offeringKey
const {NewOpt} = require('../options')

const blueprint = {
  name: 'ArgOfferingKey',
  options: [
    NewOpt('offeringKey', {
      default: 'default',
      descTemplate: 'Key for the mezzanine offering{X}',
      type: 'string'
    })
  ]
}

const New = context => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  New
}
