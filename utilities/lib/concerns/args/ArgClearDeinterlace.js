// code related to --clear-deinterlace arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgDeinterlace',
  options: [
    NewOpt('clearDeinterlace', {
      descTemplate: 'Blank out the stream\'s deinterlace field',
      type: 'boolean',
      conflicts: ['deinterlace']
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
