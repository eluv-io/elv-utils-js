// code related to --streamKey
const {NewOpt} = require('../options')

const blueprint = {
  name: 'ArgStreamKey',
  options: [
    NewOpt('streamKey', {
      descTemplate: 'Key for stream{X}',
      type: 'string'
    })
  ]
}

const New = context => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  New
}
