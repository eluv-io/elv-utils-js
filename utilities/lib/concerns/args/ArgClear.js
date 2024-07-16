// code related to --clear arg
const {NewOpt} = require('../../options')

const Logger = require('../Logger')

const blueprint = {
  name: 'ArgClear',
  concerns: [Logger],
  options: [
    NewOpt('clear', {
      descTemplate: 'Remove{X}',
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
