// code related to --language arg
'use strict'
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgLanguage',
  options: [
    NewOpt('language', {
      alias: 'lang',
      descTemplate: 'Language code{X}',
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
