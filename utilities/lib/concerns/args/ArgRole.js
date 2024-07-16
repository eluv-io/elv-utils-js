// code related to --alternateFor
const {NewOpt} = require('../../options')

const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const blueprint = {
  name: 'ArgRole',
  options: [
    NewOpt('role', {
      descTemplate: 'The role served by this alternate stream (requires --ArgAlternateFor)',
      coerce: NonBlankStrModel,
      implies: 'alternateFor',
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
