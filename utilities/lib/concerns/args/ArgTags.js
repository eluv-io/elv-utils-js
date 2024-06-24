const {NewOpt} = require('../../options')

const JSON = require('../JSON')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const blueprint = {
  name: 'ArgTags',
  concerns: [JSON],
  options: [
    NewOpt('tags', {
      descTemplate: 'Either a JSON string for tags, or the path to a JSON file containing the tags{X}',
      coerce: NonBlankStrModel,
      type: 'string'
    })
  ]
}

const New = context => {
  const argTags = context.args.tags

  // convert --tags argument to object (either literal JSON or filePath)
  const asObject = () => argTags
    ? context.concerns.JSON.parseStringOrFile({strOrPath: argTags})
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
