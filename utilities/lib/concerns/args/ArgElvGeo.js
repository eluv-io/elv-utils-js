// code related to --elvGeo arg
'use strict'
const {NewOpt} = require('../../options')

const elvRegions = require('../../data/elv_regions')

const blueprint = {
  name: 'ArgElvGeo',
  options: [
    NewOpt('elvGeo', {
      choices: Object.keys(elvRegions).sort(),
      descTemplate: 'Geographic region for the fabric nodes.',
      group: 'API',
      type: 'string'
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
