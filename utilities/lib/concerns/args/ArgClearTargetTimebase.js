// code related to --clear-target-timebase arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgClearTargetTimebase',
  options: [
    NewOpt('clearTargetTimebase', {
      descTemplate: 'Blank out the stream\'s target_timebase field',
      type: 'boolean',
      conflicts: 'targetTimebase'
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
