// code related to --deinterlace arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgDeinterlace',
  options: [
    NewOpt('deinterlace', {
      descTemplate: 'Video deinterlace method',
      type: 'string',
      choices: ['bwdif_field', 'bwdif_frame']
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
