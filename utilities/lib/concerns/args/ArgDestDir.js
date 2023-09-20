// code related to --destDir

const {NewOpt} = require('../../options')

const FabricFilePathModel = require('../../models/FabricFilePathModel')

const blueprint = {
  name: 'ArgDestDir',
  options: [
    NewOpt('destDir',
      {
        coerce: FabricFilePathModel,
        descTemplate: 'Destination directory in object{X} (should start with \\ and NOT end in \\). If omitted, root directory will be used.',
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
