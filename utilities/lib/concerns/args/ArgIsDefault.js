const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgIsDefault',
  options: [
    NewOpt('isDefault', {
      descTemplate: 'Set to be the default{X}',
      type: 'boolean'
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
