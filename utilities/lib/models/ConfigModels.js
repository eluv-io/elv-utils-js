/*
Models used for validation while processing --confs arguments.

Each file listed after --confs contains a Configuration

A Configuration has 2 top level keys:

   'defaults' - contains the default VarSet supplied to all utility scripts.
   'presets'  - object with preset names as keys and VarSets as values

The first file listed after --confs must have both top level keys. Subsequent files (which get merged into the first
file's Configuration) are allowed to omit one of the keys.

A VarSet contains key/value pairs, where the key is either a variable name or one of the 'presets_*' directives -
presets_add, presets_omit, or presets_use. Values contain variable definitions (null, string, or non-empty array of string)
unless the key is one of the preset_* directives, in which case the value must be an array of strings containing preset names.

Many of the models have variations to allow validation of intermediate results during processing:

  *RawModel: Validates original JSON data, usually loaded from files.

  *MergedModel: Validates data after merging 1 or more Raw models (if only 1 item was supplied to --vars, it will be
                merged with an empty skeleton to force processing of 'presets_add' and 'presets_omit'). Cannot contain
                'presets_add' or 'presets_omit' entries (these get resolved into 'presets_use' during merge).

  *ResolvedModel: Validates data after resolving all 'presets_use' entries. Cannot contain 'presets_use', 'presets_add',
                  or 'presets_omit'. ('presets_use' entries are imported into the



*/

const assertAfterCheck = require('@eluvio/elv-js-helpers/ModelAssertion/assertAfterCheck')
const assertionErrMsg = require('@eluvio/elv-js-helpers/ModelAssertion/assertionErrMsg')
const defArrayModel = require('@eluvio/elv-js-helpers/ModelFactory/defArrayModel')
const defBasicModel = require('@eluvio/elv-js-helpers/ModelFactory/defBasicModel')
const defTypedKVObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defTypedKVObjModel')
const defNonEmptyArrModel = require('@eluvio/elv-js-helpers/ModelFactory/defNonEmptyArrModel')
const defRegexMatchedStrModel = require('@eluvio/elv-js-helpers/ModelFactory/defRegexMatchedStrModel')
const defSealedObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defSealedObjModel')
const isObject = require('@eluvio/elv-js-helpers/Boolean/isObject')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const NonEmptyArrModel = require('@eluvio/elv-js-helpers/Model/NonEmptyArrModel')
const passesModelCheck = require('@eluvio/elv-js-helpers/Boolean/passesModelCheck')

// -----------------------------
// REGEXES
// -----------------------------

// Keys in Configurations must be made of upper and lower case letters, digits, underscore, or dash
// Must be at least 1 char
// Cannot start or end with dash
const KEY_REGEX = /^[a-z0-9_]+([a-z0-9_-]*[a-z0-9_]+)*$/i

// Used to decide whether a VarSet entry should be used to set an environment variable.
// If a key meets all the following conditions it will be used to set an environment variable:
//
//  * contains only capital letters and underscores
//  * starts with a capital letter
//  * contains at least 1 underscore
//  * ends with a capital letter
const ENV_VAR_REGEX = /[A-Z]+(_+[A-Z]+)+/

// Regex to match substitution variables:
//   must start with "$"
//   the rest must be either letters, digits, dash ("-") or underscore ("_")
//   cannot start or end with dash ("-")
//
// valid:
//   $f
//   $__FOO-Bar3__
//
// invalid:
//  $-FOO
//  $FOO- ("$FOO" will be matched and substituted, trailing dash will be left in place)
//
// note also that "$defaults", "$presets", and "$presets_use" among others are illegal, but those are enforced outside of regex
//
// 2 dollar signs in a row indicate escaped dollar sign to include in final output, they will be ignored
const FIND_SUBST_VAR_REGEX = /(?<=[^$]|(\$\$)+|^)\$[A-Z0-9_]+([A-Z0-9_-]*[A-Z0-9_]+)*/gmi

// The command line option `--confs` and the env var `ELVUTILS_CONFIG` control which Configurations are used.
// The command line option `--presets` allows run-time overrides of Configuration defaults.
// These must not get set/changed by the Configurations themselves.
const ALWAYS_FORBIDDEN_KEYS = [
  'conf',
  'ELVUTILS_CONFIG',
  'presets'
]

// Variables that have hard-coded substitution logic
const BUILT_IN_SUBST_VAR_NAMES = [
  '_ElvUtilsDir_'
]

const CONF_TOP_LEVEL_KEYS = [
  'defaults',
  'presets'
]

const PRESET_DIRECTIVE_KEYS = [
  'presets_add',
  'presets_omit',
  'presets_use'
]

const FORBIDDEN_CONF_RAW_KEYS = [
  ALWAYS_FORBIDDEN_KEYS,
  BUILT_IN_SUBST_VAR_NAMES,
  CONF_TOP_LEVEL_KEYS,
].flat()

// During resolution, any built-in substitution variables that were used will get added to VarSet,
// so items in BUILT_IN_SUBST_VAR_NAMES are allowed
const FORBIDDEN_VARSET_SUBSTITUTED_KEYS = [
  ALWAYS_FORBIDDEN_KEYS,
  PRESET_DIRECTIVE_KEYS,
  CONF_TOP_LEVEL_KEYS
].flat()

// after conversion to flat map, 'defaults' is allowed as a key
const FORBIDDEN_FLAT_MAP_KEYS = [
  ALWAYS_FORBIDDEN_KEYS,
  BUILT_IN_SUBST_VAR_NAMES,
  PRESET_DIRECTIVE_KEYS,
  'presets'
].flat()

const FORBIDDEN_PRESET_NAMES = [
  FORBIDDEN_CONF_RAW_KEYS,
  PRESET_DIRECTIVE_KEYS
].flat()

// Strings from BUILT_IN_SUBST_VAR_NAMES are allowed
const FORBIDDEN_SUBST_VAR_NAMES = [
  ALWAYS_FORBIDDEN_KEYS,
  CONF_TOP_LEVEL_KEYS,
  PRESET_DIRECTIVE_KEYS
].flat()

const EMPTY_CONFIG = {
  defaults: {},
  presets: {}
}

// =============================
// MODELS
// =============================

// -----------------------------
// MODELS - Base (building blocks)
// -----------------------------

// Base model for keys appearing in Configuration, VarSet - only tests against regex for basic format.
// Does not check for forbidden strings
const KeyModel = defRegexMatchedStrModel(
  'Key',
  KEY_REGEX,
  'is not in valid format (only letters, numbers, dash and underscore are allowed, and cannot start or end with a dash)'
)

// Keys in the 'presets' section of a Configuration, as well elements of presets_add/presets_omit/presets_use arrays.
const PresetNameModel = KeyModel.extend().as('PresetName').assert(
  x => !FORBIDDEN_PRESET_NAMES.includes(x),
  assertionErrMsg('is not a legal preset name')
)

// 'presets_use' array (is allowed to be an empty array, == remove all previously included presets)
const PresetNameListModel = defNonEmptyArrModel(
  'PresetNameList',
  PresetNameModel
)

// 'presets_add' and 'presets_omit' arrays (cannot be an empty array)
const PresetNameListNonEmptyModel = defNonEmptyArrModel(
  'PresetNameListNonEmpty',
  PresetNameModel
)

// Keys in flattened map of a Configuration ('defaults' is allowed as a key)
const FlatConfKeyModel = KeyModel.extend()
  .as('FlatConfKey')
  .assert(
    x => !FORBIDDEN_FLAT_MAP_KEYS.includes(x),
    assertionErrMsg('is not a legal key for configuration flat map')
  )

// Parameter used for detecting circular preset references
const FlatConfKeyListModel = defArrayModel(
  'FlatConfKeyList',
  FlatConfKeyModel
)

// VarSet values can be null, non-blank string, or non-empty array of non-blank string
const VarSetValueModel = defBasicModel(
  'VarSetValue',
  [null, NonBlankStrModel, defNonEmptyArrModel('NonEmptyStringArray', NonBlankStrModel)]
)

const SubstVarNameModel = KeyModel.extend().as('SubstVarName').assert(
  x => !FORBIDDEN_SUBST_VAR_NAMES.includes(x),
  assertionErrMsg('is not a legal substitution variable name')
)

// Parameter used for detecting circular variable substitution references
const SubstVarNameListModel = defArrayModel(
  'SubstVarNameList',
  SubstVarNameModel
)

// -----------------------------
// MODELS - Raw
// -----------------------------

// Keys in a raw VarSet (i.e. under '/defaults/', or under '/presets/PRESET_NAME/
const VarSetRawKeyModel = KeyModel.extend().as('VarSetRawKey').assert(
  x => !FORBIDDEN_CONF_RAW_KEYS.includes(x),
  assertionErrMsg('must not be a reserved term')
)

// VarSet (i.e. a particular preset, or the 'defaults' set) contained within a raw Configuration
// Can contain 'presets_*' entries
// 'presets_add' and 'presets_omit' must not be empty arrays
// 'presets_use' can be an empty array (meaning remove from this set any and all presets included via previously
// processed Configurations)
const VarSetRawModel = defTypedKVObjModel(
  'VarSetRaw',
  VarSetRawKeyModel,
  VarSetValueModel
).assert(
  ...assertAfterCheck(
    isObject,
    x => Object.keys(x).includes('presets_use') ? PresetNameListModel(x.presets_use) : true,
    '\'presets_use\' value is invalid'
  )
).assert(
  ...assertAfterCheck(
    isObject,
    x => Object.keys(x).includes('presets_add') ? PresetNameListNonEmptyModel(x.presets_add) : true,
    '\'presets_add\' value is invalid'
  )
).assert(
  ...assertAfterCheck(
    isObject,
    x => Object.keys(x).includes('presets_omit') ? PresetNameListNonEmptyModel(x.presets_omit) : true,
    '\'presets_omit\' value is invalid'
  )
).assert(...assertAfterCheck(isObject,
  d => !d.presets_use || (!d.presets_add && !d.presets_omit),
  'cannot have \'presets_add\' or \'presets_omit\' in variable set if \'presets_use\' is present'
))

// Used internally when converting Configuration into a flat structure for easier processing
const FlatConfRawModel = defTypedKVObjModel(
  'FlatConfRaw',
  FlatConfKeyModel,
  VarSetRawModel
)

// 'presets' section of a raw Configuration
const PresetsRawModel = defTypedKVObjModel(
  'Presets',
  PresetNameModel,
  VarSetRawModel
)


// A (complete) raw Configuration (usually from a JSON file)
// Can include 'presets_*' keys
// Must have both 'defaults' and 'presets' as top level keys
// Used to validate the first specified Configuration of a list (subsequent Configurations that are to be merged into
// the first can be partial, i.e. have only 'defaults' or only 'presets')
const ConfRawModel = defSealedObjModel(
  'ConfRaw',
  {
    defaults: VarSetRawModel,
    presets: PresetsRawModel
  }
)

// A (potentially partial) Configuration (usually from a JSON file)
// Can include 'presets_*' keys
// Must have at least one of 'defaults' and 'presets' as top level keys
// Used to validate the second and subsequent Configurations in a list (Configurations that are to be merged into the
// first Configuration in list)
const ConfRawPartialModel = defSealedObjModel(
  'ConfRawPartial',
  {
    defaults: [VarSetRawModel],
    presets: [PresetsRawModel]
  }
).assert(
  x => !!x.defaults || !!x.presets,
  'Configuration missing both \'defaults\' and \'presets\''
)


const ConfRawListModel = defNonEmptyArrModel('ConfRawList', ConfRawPartialModel)
  .assert(
    ...assertAfterCheck(
      passesModelCheck(NonEmptyArrModel),
      x => ConfRawModel(x[0]),
      'First configuration must contain both \'defaults\' and \'presets\''
    )
  )


// -----------------------------
// MODELS - Merged
// -----------------------------

const VarSetMergedModel = VarSetRawModel.extend().as('VarSetMerged').assert(...assertAfterCheck(isObject,
  d => !d.presets_add && !d.presets_omit,
  '\'presets_add\' or \'presets_omit\' found after merging'
))

// Used internally when converting Configuration into a flat structure for easier processing
const FlatConfMergedModel = defTypedKVObjModel(
  'FlatConfMerged',
  FlatConfKeyModel,
  VarSetMergedModel
)

const PresetsMergedModel = defTypedKVObjModel(
  'PresetsMerged',
  PresetNameModel,
  VarSetMergedModel
)

const ConfMergedModel = defSealedObjModel(
  'ConfMerged',
  {
    defaults: VarSetMergedModel,
    presets: PresetsMergedModel
  }
)

// -----------------------------
// MODELS - Resolved
// -----------------------------

const VarSetResolvedModel = defTypedKVObjModel(
  'VarSetResolved',
  VarSetRawKeyModel,
  VarSetValueModel
).assert(...assertAfterCheck(isObject,
  d => !d.presets_add && !d.presets_omit && !d.presets_use,
  '\'presets_add\', \'presets_omit\', or \'presets_use\' found after resolving presets'
))

const PresetsResolvedModel = defTypedKVObjModel(
  'PresetsResolved',
  PresetNameModel,
  VarSetResolvedModel
)

const ConfResolvedModel = defSealedObjModel(
  'ConfResolved',
  {
    defaults: VarSetResolvedModel,
    presets: PresetsResolvedModel
  }
)

// -----------------------------
// MODELS - Substituted
// -----------------------------

// After variable cross-reference substitution, BUILT_IN_SUBST_VAR_NAMES are allowed as keys
const VarSetSubstitutedKeyModel = KeyModel.extend().as('VarSetSubstitutedKey').assert(
  x => !FORBIDDEN_VARSET_SUBSTITUTED_KEYS.includes(x),
  assertionErrMsg('is not a legal key for a variable set after cross-reference substitutions have been processed')
)

const VarSetSubstitutedModel = defTypedKVObjModel(
  'VarSetSubstituted',
  VarSetSubstitutedKeyModel,
  VarSetValueModel
).assert(...assertAfterCheck(isObject,
  d => !d.presets_add && !d.presets_omit && !d.presets_use,
  '\'presets_add\', \'presets_omit\', or \'presets_use\' found after resolving presets'
))

module.exports = {
  BUILT_IN_SUBST_VAR_NAMES,
  ConfMergedModel,
  ConfRawListModel,
  ConfRawModel,
  ConfRawPartialModel,
  ConfResolvedModel,
  EMPTY_CONFIG,
  ENV_VAR_REGEX,
  FIND_SUBST_VAR_REGEX,
  FlatConfKeyListModel,
  FlatConfKeyModel,
  FlatConfMergedModel,
  FlatConfRawModel,
  FORBIDDEN_SUBST_VAR_NAMES,
  PresetNameListModel,
  PresetNameListNonEmptyModel,
  PresetNameModel,
  PresetsMergedModel,
  PresetsRawModel,
  PresetsResolvedModel,
  SubstVarNameListModel,
  SubstVarNameModel,
  VarSetMergedModel,
  VarSetRawModel,
  VarSetResolvedModel,
  VarSetSubstitutedModel
}
