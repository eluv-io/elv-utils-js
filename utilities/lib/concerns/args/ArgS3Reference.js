// code related to --s3Reference arg
'use strict'
const {NewOpt} = require('../../options')

const Logger = require('../kits/Logger')

const blueprint = {
  name: 'ArgS3Reference',
  concerns: [Logger],
  options: [
    NewOpt('s3Reference', {
      conflicts: ['s3Copy', 'encrypt'],
      descTemplate: 'If specified, files will be added as links to S3 bucket items rather than uploaded from the local filesystem',
      group: 'Cloud',
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
