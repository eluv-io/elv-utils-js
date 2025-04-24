// code related to --clear-target-frame-rate arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgClearTargetFrameRate',
  options: [
    NewOpt('clearTargetFrameRate', {
      descTemplate: 'Blank out the stream\'s target_frame_rate field',
      type: 'boolean',
      conflicts: 'targetFrameRate'
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
