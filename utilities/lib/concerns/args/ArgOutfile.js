// code related to --outfile arg
'use strict'
const {NewOpt} = require('../../options.js')

const blueprint = {
  name: 'ArgOutfile',
  options: [
    NewOpt('outfile', {
      descTemplate: 'Path of file to save{X} to.',
      normalize: true,
      type: 'string'
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
