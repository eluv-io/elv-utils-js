// code related to --alternateFor
'use strict'
const {NewOpt} = require('../../options')

const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const blueprint = {
  name: 'ArgAlternateFor',
  options: [
    NewOpt('alternateFor', {
      descTemplate: 'Make this stream an alternate for existing stream that has this key',
      coerce: NonBlankStrModel,
      implies: 'role',
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
