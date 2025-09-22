'use strict'
const defObjectModel = require('@eluvio/elv-js-helpers/ModelFactory/defObjectModel')
const defTypedKVObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defTypedKVObjModel')
const {VariantModel} = require('./Variant')
const {MediaSourceModel} = require('./Media')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const MasterSourcesModel = defTypedKVObjModel('MasterSources', NonBlankStrModel, MediaSourceModel)
const MasterVariantsModel = defTypedKVObjModel('MasterVariants', NonBlankStrModel, VariantModel)

const MasterModel = defObjectModel('Master', {
  sources: MasterSourcesModel,
  variants: MasterVariantsModel
})

module.exports = {
  MasterModel,
  MasterSourcesModel,
  MasterVariantsModel
}
