// code related to --clear-mapping arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgClearMapping',
  options: [
    NewOpt('clearMapping', {
      descTemplate: 'Blank out the stream\'s mapping_info field',
      type: 'boolean',
      conflicts: 'mapping'
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
