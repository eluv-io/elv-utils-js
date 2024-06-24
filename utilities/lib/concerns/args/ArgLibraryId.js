// code related to --libraryId
const LibraryIdModel = require('../../models/LibraryIdModel')

const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgLibraryId',
  options: [
    NewOpt('libraryId',
      {
        descTemplate: 'Library ID{X} (should start with \'ilib\')',
        coerce: LibraryIdModel,
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
