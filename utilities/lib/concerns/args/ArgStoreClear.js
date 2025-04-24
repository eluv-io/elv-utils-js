// code related to --storeClear arg
'use strict'
const {NewOpt} = require('../../options')

const Logger = require('../kits/Logger.js')

const blueprint = {
  name: 'ArgStoreClear',
  concerns: [Logger],
  options: [
    NewOpt('storeClear', {
      descTemplate: 'Use unencrypted storage{X}',
      type: 'boolean'
    })
  ]
}

const New = () => {

  return {}
}

module.exports = {
  blueprint,
  New
}
