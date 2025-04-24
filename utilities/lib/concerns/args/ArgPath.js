// code related to --path (metadata path)
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgPath',
  options: [
    NewOpt('path', {
      descTemplate: 'Path within metadata{X} (start with \'/\').',
      type: 'string'
    }),
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
