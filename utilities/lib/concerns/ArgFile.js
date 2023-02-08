const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const {NewOpt} = require('../options')

const blueprint = {
  name: 'ArgFile',
  options: [
    NewOpt('file', {
      descTemplate: 'Path to{X} file',
      coerce: NonBlankStrModel,
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
