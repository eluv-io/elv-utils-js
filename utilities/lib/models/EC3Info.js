const defBoundedIntModel = require('@eluvio/elv-js-helpers/ModelFactory/defBoundedIntModel')
const defSealedObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defSealedObjModel')
const IntegerModel = require('@eluvio/elv-js-helpers/Model/IntegerModel')

// media/common/EC3Info
const EC3InfoModel = defSealedObjModel(
  'EC3Info',
  {
    chan_map: defBoundedIntModel('ChanMap', 1, 65535, true, true),
    joc: Boolean,
    complexity_index: IntegerModel
  }
).assert(x => !(x.joc && x.complexity_index <= 0), (assertionResult, data, attributePath) => {
  return `complexity_index must be > 0 when joc is true (got: ${data.complexity_index})`
})

module.exports = EC3InfoModel
