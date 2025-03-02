const defSealedObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defSealedObjModel')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const PositiveIntModel = require('@eluvio/elv-js-helpers/Model/PositiveIntModel')

const FabricFilePathModel = require('./FabricFilePathModel')

const HtmlWatermarkModel = defSealedObjModel(
  'HtmlWatermark',
  {
    align_h: ['left', 'center', 'right'],
    align_v: ['top', 'middle', 'bottom'],
    html: FabricFilePathModel,
    render_height: PositiveIntModel,
    render_width: PositiveIntModel
  }
)

module.exports = HtmlWatermarkModel