// code related to --label arg
'use strict'
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgLabel',
  options: [
    NewOpt('label', {
      descTemplate: 'Label{X}',
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
