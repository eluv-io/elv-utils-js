const FabricFilePathModel = require('../../models/FabricFilePathModel')

const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgFilePath',
  options: [
    NewOpt('filePath', {
      descTemplate: 'Path of{X} file within object (start with \'/\')',
      coerce: FabricFilePathModel,
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
