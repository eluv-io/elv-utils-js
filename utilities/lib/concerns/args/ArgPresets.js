// NOTE: This is included automatically in all utility scripts by Utility.js

const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgPresets',
  options: [
    NewOpt('presets', {
      descTemplate: 'Name(s) of additional preset(s) to merge on top of defaults from configuration file(s) (specified with --confs and/or $ELVUTILS_CONF).',
      group: 'Automation',
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
