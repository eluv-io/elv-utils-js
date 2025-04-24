// code related to --clear-language arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgClearLanguage',
  options: [
    NewOpt('clearLanguage', {
      descTemplate: 'Clear stream\'s language field',
      type: 'boolean',
      conflicts: 'language'
    })
  ]
}


// eslint-disable-next-line no-unused-vars
const New = context => {
  return {}
}

module.exports = {
  blueprint,
  New
}
