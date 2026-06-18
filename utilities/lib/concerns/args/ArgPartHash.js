// code related to --partHash
'use strict'

const {NewOpt} = require('../../options')
const PartHashModel = require('../../models/PartHashModel.js')

const blueprint = {
  name: 'ArgPartHash',
  options: [
    NewOpt('partHash',
      {
        descTemplate: 'Part Hash{X} (should start with \'hqp_\' or \'hqpe\')',
        coerce: PartHashModel,
        type: 'string'
      }
    )
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
