// Tags for media
const defBasicModel = require('@eluvio/elv-js-helpers/ModelFactory/defBasicModel')
const defTypedKVObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defTypedKVObjModel')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const TagsModel = defTypedKVObjModel('Tags', NonBlankStrModel, String)
const TagsOptionalModel = defBasicModel('TagsOptional', [null, undefined, TagsModel])

module.exports = {
  TagsModel,
  TagsOptionalModel
}