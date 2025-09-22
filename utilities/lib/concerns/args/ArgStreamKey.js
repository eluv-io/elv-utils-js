// code related to --streamKey
'use strict'
const {NewOpt} = require('../../options.js')

const blueprint = {
  name: 'ArgStreamKey',
  options: [
    NewOpt('streamKey', {
      descTemplate: 'Key for stream{X}',
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
