// code related to --noEncryptionConk arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgNoEncryptionConk',
  options: [
    NewOpt('noEncryptionConk', {
      descTemplate: 'Do not create an encryption conk',
      type: 'boolean',
      conflicts: ['createKMSConk']
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
