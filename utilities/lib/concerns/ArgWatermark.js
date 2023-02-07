const {NewOpt} = require('../options')

const JSON = require('./JSON')

const blueprint = {
  name: 'ArgWatermark',
  concerns: [JSON],
  options: [
    NewOpt('watermark', {
      descTemplate: 'JSON string for watermark settings or path to JSON file containing the watermark settings',
      conflicts: ['clear'],
      type: 'string'
    })
  ]
}

const New = context => {
  const argWatermark = context.args.watermark

  // convert --watermark argument to object (either literal JSON or filePath)
  const asObject = () => argWatermark
    ? context.concerns.JSON.parseStringOrFile({strOrPath: argWatermark})
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
