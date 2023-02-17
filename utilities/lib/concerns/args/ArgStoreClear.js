// code related to --storeClear arg
const {NewOpt} = require('../../options')

const Logger = require('../Logger')

const blueprint = {
  name: 'ArgStoreClear',
  concerns: [Logger],
  options: [
    NewOpt('storeClear', {
      descTemplate: 'Use unencrypted storage{X}',
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
