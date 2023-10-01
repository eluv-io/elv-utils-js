// code related to --resolveLinks arg
const {NewOpt} = require('../../options')

const Logger = require('../Logger')

const blueprint = {
  name: 'ArgResolve',
  concerns: [Logger],
  options: [
    NewOpt('resolve', {
      descTemplate: 'Resolve links in metadata',
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
