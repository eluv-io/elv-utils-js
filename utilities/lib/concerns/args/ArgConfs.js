// NOTE: This is included automatically in all utility scripts by Utility.js

const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgConfs',
  options: [
    NewOpt('confs', {
      descTemplate: 'Path(s) to configuration JSON file(s) containing values to supply missing command line options.',
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
