const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgReplace',
  options: [
    NewOpt('replace', {
      descTemplate: 'Replace any existing data',
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
