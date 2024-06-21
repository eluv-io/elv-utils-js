// code related to --streamKey
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgStreamKey',
  options: [
    NewOpt('streamKey', {
      descTemplate: 'Key for stream{X}',
      type: 'string'
    })
  ]
}

// eslint-disable-next-line no-unused-vars
const New = context => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  New
}
