// code related to --nodeId
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgNodeId',
  options: [
    NewOpt('nodeId', {
      descTemplate: 'Id of node (must start with "inod")',
      type: 'string'
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
