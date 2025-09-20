const defSealedObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defSealedObjModel')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const PositiveIntModel = require('@eluvio/elv-js-helpers/Model/PositiveIntModel')

const FabricFilePathModel = require('./FabricFilePathModel')

const ImageWatermarkModel = defSealedObjModel(
  'ImageWatermark',
  {
    align_h: ['left', 'center', 'right'],
    align_v: ['top', 'middle', 'bottom'],
    image: FabricFilePathModel,
    margin_h: NonBlankStrModel,
    margin_v: NonBlankStrModel,
    target_video_height: [PositiveIntModel]
  }
)

module.exports = ImageWatermarkModel
