// code related to --s3Copy arg
'use strict'
const {NewOpt} = require('../../options')

const Logger = require('../kits/Logger')

const blueprint = {
  name: 'ArgS3Copy',
  concerns: [Logger],
  options: [
    NewOpt('s3Copy', {
      conflicts: 's3Reference',
      descTemplate: 'If specified, files will be copied from an S3 bucket instead of uploaded from the local filesystem',
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
