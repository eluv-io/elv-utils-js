const {NewOpt} = require('../options')

const ProcessJSON = require('./libs/ProcessJSON.js')

const blueprint = {
  name: 'ArgMetadata',
  concerns: [ProcessJSON],
  options: [
    NewOpt('metadata', {
      descTemplate: 'Either a JSON string for metadata, or the path to a JSON file containing the metadata{X}',
      type: 'string'
    })
  ]
}

const New = context => {
  const argMetadata = context.args.metadata

  // convert --metadata argument to object (either literal JSON or filePath)
  const asObject = () => argMetadata
    ? context.concerns.ProcessJSON.parseStringOrFile({strOrPath: argMetadata})
    : null

  // instance interface
  return {
    asObject
  }
}

module.exports = {
  blueprint,
  New
}
