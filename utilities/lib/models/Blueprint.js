// Specifies concerns, options and checksMap for a Concern or Script

const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const {
  CheckedResult,
  FunctionModel,
  KVMapModelFactory,
  ObjectModel
} = require('./Models')

const OptCheckModel = FunctionModel(Object).return(Boolean)
const OptChecksMapModel = KVMapModelFactory(OptCheckModel)

const BlueprintModel = ObjectModel({
  checksMap: [KVMapModelFactory(OptCheckModel)],
  concerns: [Array],
  name: NonBlankStrModel,
  options: [Array],
})

const CheckedBlueprint = CheckedResult(BlueprintModel)

module.exports = {
  BlueprintModel,
  CheckedBlueprint,
  OptCheckModel,
  OptChecksMapModel
}
