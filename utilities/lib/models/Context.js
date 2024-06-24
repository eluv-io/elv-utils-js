const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const {
  ArrayModel,
  ObjectModel,
  CheckedResult
} = require('./Models')

const ContextModel = ObjectModel({
  argList: ArrayModel(NonBlankStrModel),
  args: Object,
  concerns: Object,
  cwd: String,
  env: Object
}).as('Context')

const CheckedContext = CheckedResult(ContextModel)

module.exports = {
  CheckedContext,
  ContextModel
}
