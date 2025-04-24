// code related to --overwrite arg
'use strict'
const {NewOpt} = require('../../options.js')

const blueprint = {
  name: 'ArgOverwrite',
  options: [
    NewOpt('overwrite', {
      descTemplate: 'Replace target{X} if it already exists.',
      type: 'boolean'
    })
  ]
}

// eslint-disable-next-line no-unused-vars
const New = context => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  New
}
