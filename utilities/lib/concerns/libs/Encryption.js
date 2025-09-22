// code related to working with Content Fabric encryption
'use strict'

const Logger = require('../kits/Logger')

const blueprint = {
  name: 'Encryption',
  concerns: [Logger]
}

// eslint-disable-next-line no-unused-vars
const New = context => {
  const createConk = async ({elvClient, libraryId, objectId, versionHash, writeToken, createKMSConk}) => {
    return await elvClient.CreateEncryptionConk({
      createKMSConk,
      libraryId,
      objectId,
      versionHash,
      writeToken
    })
  }

  // instance interface
  return {
    createConk
  }
}

module.exports = {
  blueprint,
  New
}
