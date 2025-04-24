// code related to --clear-channel-index arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgClearChannelIndex',
  options: [
    NewOpt('clearChannelIndex', {
      descTemplate: 'Clear any channel_index values in stream \'sources\' list',
      type: 'boolean',
      conflicts: 'channelIndex'
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
