// code related to --clear arg
'use strict'
const {NewOpt} = require('../../options')

const Logger = require('../kits/Logger.js')

const blueprint = {
  name: 'ArgClear',
  concerns: [Logger],
  options: [
    NewOpt('clear', {
      descTemplate: 'Remove{X}',
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
