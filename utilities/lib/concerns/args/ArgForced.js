// code related to --forced arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgForced',
  options: [
    NewOpt('forced', {
      descTemplate: 'Subtitles are forced',
      type: 'boolean'
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
