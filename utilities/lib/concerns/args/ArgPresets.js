// NOTE: This is included automatically in all utility scripts by Utility.js

const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgPresets',
  options: [
    NewOpt('presets', {
      descTemplate: 'Name(s) of presets to merge on top of defaults from files specified with --conf.',
      group: 'Automation',
      implies: 'conf',
      string: true,
      type: 'array'
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
