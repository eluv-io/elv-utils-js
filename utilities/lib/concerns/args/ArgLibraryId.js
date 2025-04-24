// code related to --libraryId
'use strict'

const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgLibraryId',
  options: [
    NewOpt('libraryId',
      {
        descTemplate: 'Library ID{X} (should start with \'ilib\')',
        type: 'string'
      }
    )
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
