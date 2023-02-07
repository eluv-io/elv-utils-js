const defBoundedNumModel = require('@eluvio/elv-js-helpers/ModelFactory/defBoundedNumModel')
const defSealedObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defSealedObjModel')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const TextWatermarkModel = defSealedObjModel(
  'ImageWatermark',
  {
    font_color: NonBlankStrModel,
    font_relative_height: defBoundedNumModel('FontRelativeHeight', 0, 1, false, true),
    shadow: [Boolean],
    shadow_color: [NonBlankStrModel],
    template: NonBlankStrModel,
    x: NonBlankStrModel,
    y: NonBlankStrModel
  }
)

module.exports = TextWatermarkModel
