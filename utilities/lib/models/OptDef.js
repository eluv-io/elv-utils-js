// Validators used when defining and processing options

const R = require('@eluvio/ramda-fork')

const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const {
  ArrayModel,
  BasicModel,
  FunctionModel,
  KVMapModelFactory,
  NonBlankStringOrArrayOfSame,
  NonNull,
  CheckedResult,
  SealedModel
} = require('./Models')

// used by both YargsOptModel and OptDefModel
const commonOptFields = {
  alias: [NonBlankStringOrArrayOfSame],
  choices: [ArrayModel(NonNull)],
  conflicts: [NonBlankStringOrArrayOfSame],
  coerce: [FunctionModel(NonNull).return(NonNull)],
  default: [NonNull],
  demand: [Boolean],
  group: [NonBlankStrModel],
  hidden: [Boolean],
  implies: [NonBlankStringOrArrayOfSame],
  normalize: [Boolean],
  number: [Boolean],
  requiresArg: [Boolean],
  string: [Boolean],
  type: [BasicModel(['array', 'boolean', 'number', 'string'])]
}

const optDescFields = {
  descTemplate: NonBlankStrModel,
  forX: [NonBlankStrModel],
  ofX: [NonBlankStrModel],
  X: [NonBlankStrModel]
}

const optDefFields = R.mergeAll([
  commonOptFields,
  optDescFields
])
const OptDefModel = SealedModel(optDefFields).as('OptDef')
const CheckedOptDef = CheckedResult(OptDefModel)

// for overrides, descTemplate is optional
const optDefOverrideFields = R.mergeAll([
  commonOptFields,
  optDescFields,
  {descTemplate: [NonBlankStrModel]}
])
const OptDefOverrideModel = SealedModel(optDefOverrideFields).as('OptDefOverride')
const CheckedOptDefOverride = CheckedResult(OptDefOverrideModel)

const OptDefMapModel = KVMapModelFactory(OptDefModel).as('OptDefMap')
const CheckedOptDefMap = CheckedResult(OptDefMapModel)

const yargsOptFields =  R.mergeRight(
  commonOptFields,
  {desc: String}
)
const YargsOptModel = SealedModel(yargsOptFields).as('YargsOpt')
const CheckedYargsOpt = CheckedResult(YargsOptModel)

const YargsOptMapModel = KVMapModelFactory(YargsOptModel).as('YargsOptMap')
const CheckedYargsOptMap = CheckedResult(YargsOptMapModel)

module.exports = {
  OptDefMapModel,
  OptDefModel,
  OptDefOverrideModel,
  yargsOptFields,
  YargsOptModel,
  YargsOptMapModel,
  CheckedOptDef,
  CheckedOptDefMap,
  CheckedOptDefOverride,
  CheckedYargsOpt,
  CheckedYargsOptMap
}
