// code related to --files arg
'use strict'
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const defNonEmptyArrModel = require('@eluvio/elv-js-helpers/ModelFactory/defNonEmptyArrModel')

const NonEmptyArrayOfNonBlankStr = defNonEmptyArrModel(
  'NonEmptyArrayOfNonBlankStr',
  NonBlankStrModel
)

const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgFiles',
  options: [
    NewOpt('files', {
      descTemplate: 'List of file paths{X}, separated by spaces',
      coerce: NonEmptyArrayOfNonBlankStr,
      type: 'array'
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
