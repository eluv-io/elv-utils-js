const defSealedObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defSealedObjModel')
const IntegerModel = require('@eluvio/elv-js-helpers/Model/IntegerModel')

// media/common/DOVIInfo
const DOVIInfoModel = defSealedObjModel(
  'DOVIInfo',
  {
    bl_signal_compatibility_id: IntegerModel,
    fourcc: String,
    level: IntegerModel,
    profile: IntegerModel,
  }
)

module.exports = DOVIInfoModel
