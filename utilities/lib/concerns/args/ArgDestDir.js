const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgDestDir',
  options: [
    NewOpt('destDir', {
      descTemplate: 'Destination directory (must start with \'/\')',
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
