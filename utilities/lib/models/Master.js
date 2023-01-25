const {KVMapModelFactory, ObjectModel} = require('./Models')
const {VariantModel} = require('./Variant')
const {MediaSourceModel} = require('./Media')

const MasterSourcesModel = KVMapModelFactory(MediaSourceModel)
const MasterVariantsModel = KVMapModelFactory(VariantModel)

const MasterModel = ObjectModel({
  sources: MasterSourcesModel,
  variants: MasterVariantsModel
})

module.exports = {
  MasterModel
}


