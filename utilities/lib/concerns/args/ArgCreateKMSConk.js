// code related to --createKMSConk arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgCreateKMSConk',
  options: [
    NewOpt('createKMSConk', {
      descTemplate: 'Create a KMS conk',
      type: 'boolean',
      conflicts: ['noEncryptionConk']
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
