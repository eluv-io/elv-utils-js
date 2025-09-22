// Tags for media
'use strict'
const defBasicModel = require('@eluvio/elv-js-helpers/ModelFactory/defBasicModel')
const defTypedKVObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defTypedKVObjModel')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const StringModel = require('@eluvio/elv-js-helpers/Model/StringModel')

const TagsModel = defTypedKVObjModel('Tags', NonBlankStrModel, StringModel)
const TagsOptionalModel = defBasicModel('TagsOptional', [null, undefined, TagsModel])

module.exports = {
  TagsModel,
  TagsOptionalModel
}