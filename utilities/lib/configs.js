// code related to working with Configurations (specified with --confs)

// TODO: make function inputs/outputs compatible for chaining
// TODO: use optional chaining operator to shorten debug statements
// TODO: make arg checking all use throwIfArgsBad
// TODO: change substituteOneValueXrefs to return value without modifying varset (avoid need for VarSetSubstitutedModel and inadvertent creation of extra env vars)

// A Configuration contains sets of variables ("VarSets") that can be used to supply command line arguments and set
// environment variables when running a utility script.
//
// A Configuration may have 1 VarSet stored directly as a value under top level key 'defaults' and 1 or more VarSets
// stored under top level key 'presets' with a subkey for preset name.
//
// Configurations and VarSets go through the following states:
//
// Raw: Might have just a 'defaults' section or just a 'presets' section. Can include
//      'presets_add'/'presets_omit'/'presets_use' in definitions. Multiple configurations can be specified for a
//      command, they will be merged together during argument processing.
//
// Merged: Has both 'defaults' and 'presets' sections. Can include 'presets_use' in variable sets.
//         but not 'presets_add'/'presets_omit'. If more than one Configuration was specified, they have by this point
//         been merged into one, with all 'presets_add' and 'presets_omit' operations in the raw sets having been applied.
//
// Resolved: Has both 'defaults' and 'presets' sections. Does not have any 'presets_use' directives , these declarations
//           have been expanded into the actual values from the specified preset(s)
//
//
// VarSets have an additional state:
//
// Substituted: Any substitution variables have been replaced by what they referred to.
//
'use strict'

const path = require('path')

const kindOf = require('kind-of')


const clone = require('@eluvio/elv-js-helpers/Functional/clone')
const defNonEmptyArrModel = require('@eluvio/elv-js-helpers/ModelFactory/defNonEmptyArrModel')
const flatten = require('@eluvio/elv-js-helpers/Functional/flatten')
const isUndefined = require('@eluvio/elv-js-helpers/Boolean/isUndefined')
const map = require('@eluvio/elv-js-helpers/Functional/map')
const mergeDeepRight = require('@eluvio/elv-js-helpers/Functional/mergeDeepRight')
const mergeWith = require('@eluvio/elv-js-helpers/Functional/mergeWith')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const omit = require('@eluvio/elv-js-helpers/Functional/omit')
const pick = require('@eluvio/elv-js-helpers/Functional/pick')
const pickBy = require('@eluvio/elv-js-helpers/Functional/pickBy')
const redact = require('@eluvio/elv-js-helpers/Conversion/redact')
const throwIfArgsBad = require('@eluvio/elv-js-helpers/Validation/throwIfArgsBad')
const uniq = require('@eluvio/elv-js-helpers/Functional/uniq')

const {DebugLoggerModel} = require('./debugLogger')

const {readFileJSON, ELV_UTILS_DIR} = require('./helpers')
const V = require('./models/ConfigModels')


const contextMerge = ({
  cwd,
  env,
  suppliedArgList,
  prelimParsedArgs,
  utilityArgsMap,
  confFilePaths,
  presetNames = []
}) => {
  // remove extra items from yargs
  const argsSuppliedToUtility = omit(['_', '$0'], prelimParsedArgs)

  // load, merge, and process presets for --vars
  const confResolved = readFilesAndResolve({cwd, confFilePaths})

  // merge in --presets
  const confAfterOverrides = presetNames.reduce(
    (accumulator, presetName) => overrideDefaultsWithPreset({confResolved: accumulator, presetName}),
    confResolved
  )

  // process $variable substitutions
  const varSetSubstituted = substituteVarSetXrefs(confAfterOverrides.defaults)

  // use any ALL_CAPS_ENTRIES as environment variables
  const envFromVarSet = pickBy(
    (v, k) => V.ENV_VAR_REGEX.test(k),
    varSetSubstituted
  )

  // merge into env from Utility
  let mergedEnv = {}
  // Ensure env is a normal object (command line execution would result in process.env being
  // passed in, which does not act like a normal object)
  for(const [k, v] of Object.entries(env)) {
    mergedEnv[k] = v
  }
  mergedEnv = mergeDeepRight(mergedEnv, envFromVarSet)

  // Find command line args to use from VarSet
  // filter out any null values and ALL_CAPS_ENTRIES
  const possibleArgVars = pickBy(
    (v, k) => kindOf(v) !== 'null' && !V.ENV_VAR_REGEX.test(k),
    varSetSubstituted
  )

  // get command line options supported by the utility being run
  const utilityArgNames = flatten(Object.keys(utilityArgsMap).map(k => [k, utilityArgsMap[k].alias])).filter(k => k && /^[a-z]+[a-zA-Z]*$/.test(k))

  // pluck matches out of possibleArgVars
  const matchedArgVars = pick(
    utilityArgNames,
    possibleArgVars
  )

  // don't use arg from VarSet if it was explicitly supplied to utility
  const varsForUnprovidedArgs = omit(
    Object.keys(argsSuppliedToUtility),
    matchedArgVars
  )

  // convert remaining items to array of format ['--arg1Name', 'arg1Val1', 'arg1Val2', '--arg2Name', 'arg2Val1', ... ]
  const argsToConcat = objToArgList(varsForUnprovidedArgs)

  // append to arg list
  const mergedArgList = suppliedArgList.concat(argsToConcat)

  return {mergedArgList, mergedEnv, resolvedConf: varSetSubstituted}
}

const builtInSubstVarValue = varName => {
  switch(varName) {
    case '_ElvUtilsDir_':
      return ELV_UTILS_DIR
    default:
      throw Error(`'${varName}' is not a built-in substitution variable`)
  }
}

// Return a copy of flat config with presets resolved for at least the VarSet stored under specified key  (i.e.
// 'presets_use' array gets converted to a single merged VarSet with contents from the presets, then
// explicitly defined items from original VarSet get merged as overrides on top of values from presets)
// Recursive, may return with more than one entry resolved if one of the items under 'presets_use' itself also defined
// 'presets_use'.
const flatConfResolvePresets = ({flatConfKey, flatConf, visited = []}) => {
  throwIfArgsBad(
    {
      flatConfKey: V.FlatConfKeyModel,
      flatConf: V.FlatConfMergedModel,
      visited: V.FlatConfKeyListModel
    },
    {flatConfKey, flatConf, visited}
  )

  // clone to prevent accidental mutation of original
  let result = clone(flatConf)

  const varSet = flatConf[flatConfKey]

  // if the Config does not include any presets, no resolving needed
  if(!varSet.presets_use) return result

  let includedVars = {}
  // resolve any included presets first
  const includedPresets = varSet['presets_use']

  for(const includedPresetName of includedPresets) {
    if(visited.includes(includedPresetName)) throw Error(`Circular preset reference: ${[visited, includedPresetName].flat().join(',')}`)
    // recurse, resolve included preset (if needed) that our varSet depends on
    result = flatConfResolvePresets({
      flatConfKey: includedPresetName,
      flatConf: result,
      visited: [visited, includedPresetName].flat()
    })
    includedVars = mergeDeepRight(includedVars, result[includedPresetName])
  }

  const overrides = omit(['presets_use'], varSet)
  // copy other entries besides 'presets_use'
  const resolvedVarSet = mergeDeepRight(
    includedVars,
    overrides,
  )

  // validate
  V.VarSetResolvedModel(resolvedVarSet)
  // save into flatmap
  result[flatConfKey] = resolvedVarSet
  return result
}

// merge 1..N configs, processing 'presets_add' and 'presets_omit' directives and converting to 'presets_use'
const mergeConfigList = ({configs, debugLogger}) => {
  throwIfArgsBad(
    {
      configs: V.ConfRawListModel,
      debugLogger: [DebugLoggerModel]
    },
    {configs, debugLogger}
  )

  const confs = clone(configs)
  const firstConf = confs.shift()

  // Ensure that first Configuration gets processed even if it is the only file.
  // If there was only 1 Configuration, push an empty one.
  if(confs.length === 0) confs.push(V.EMPTY_CONFIG)

  // Final merged result should have both defaults and presets and
  // should not contain any "presets_add" or "presets_omit" entries
  return V.ConfMergedModel(
    confs.reduce(
      (accumulator, nextConfig) => mergeConfigs(accumulator, nextConfig, debugLogger),
      firstConf
    )
  )
}

// merges 2 Configurations, executing 'presets_add' and 'presets_omit' directives and converting to final values for 'presets_use'
const mergeConfigs = (config1, config2, debugLogger) => {
  const dl = debugLogger
  // validate inputs
  V.ConfRawModel(config1)
  V.ConfRawPartialModel(config2)

  if(dl) {
    dl.group('MERGING 2 Configurations')
    dl.debug('\nConfig 1:\n')
    dl.debugJson(config1)
    dl.debug('\nConfig 2:\n')
    dl.debugJson(config2)
  }

  // flatten structure, removing 'presets' so all presets are at same level as 'defaults'
  const flatConf1 = configFlatten(config1)
  const flatConf2 = configFlatten(config2)
  // merge, using mergeDefs to process case where both defs have the same key
  const merged = mergeWith(mergeVarSets, flatConf1, flatConf2)

  // restore original shape, with 'presets' top level key
  const result = configUnflatten(merged)

  if(dl) {
    dl.debug('Result:')
    dl.debugJson(result)
    dl.groupEnd()
  }
  // validate and return
  return V.ConfMergedModel(result)
}

// merge 2 raw VarSets (e.g. two presets with the same name, or 2 'defaults' sections)
const mergeVarSets = (varSet1, varSet2) => {
  // clone args to prevent modification of originals
  const vSet1 = clone(varSet1)
  const vSet2 = clone(varSet2)
  // validate (make sure neither contain illegal combination of presets_use + presets_add/presets_omit
  V.VarSetRawModel(vSet1)
  V.VarSetRawModel(vSet2)

  // process first VarSet to put in merged form containing only 'presets_use' and not 'presets_add'/'presets_omit'
  // -------------------------

  if(vSet1.presets_omit) {
    // logger.warn("presets_omit found in first VarSet to merge");
    delete vSet1.presets_omit
  }

  if(vSet1.presets_add) {
    vSet1.presets_use = vSet1.presets_add
    delete vSet1.presets_add
  }

  // apply preset directives from second VarSet
  // -------------------------

  // presets_omit:
  // remove presets from vSet1 matching vSet2.presets_omit
  if(vSet2.presets_omit) {
    if(vSet1.presets_use) {
      const newList = vSet1.presets_use
        .filter(x => !vSet2.presets_omit.includes(x))
      if(newList.length === 0) {
        delete vSet1.presets_use
      } else {
        vSet1.presets_use = newList
      }
    }
  }

  // presets_add:
  // add vSet2.presets_add to end
  if(vSet2.presets_add) {
    vSet1.presets_use = vSet1.presets_use
      // .filter(x => !vSet2.presets_add.includes(x))  // filter duplicates?
      .concat(vSet2.presets_add)
  }

  // presets_use:
  // overwrite vSet1 with vSet2 if presets_use is present
  if(vSet2.presets_use) vSet1.presets_use = vSet2.presets_use

  // save our final merged 'presets_use' list, then remove all preset directives to prepare for merging rest of properties
  const savedPresetList = vSet1.presets_use
  delete vSet1.presets_use
  delete vSet2.presets_add
  delete vSet2.presets_omit
  delete vSet2.presets_use

  // merge rest of properties
  // (defs are only 1 level deep, do not contain nested objects, so shallow Object.assign is fine)
  Object.assign(vSet1, vSet2)

  // restore saved 'presets_use'
  if(savedPresetList) vSet1.presets_use = savedPresetList

  // validate and return result
  return V.VarSetMergedModel(vSet1)
}

// converts key:value map of command line options to an array of "--optionName", "value", "--optionName", "value"...
const objToArgList = obj => flatten(Object.entries(obj).map(([k, v]) => isUndefined(v) ? [] : [`--${k}`, v]))

// Used for processing the `--presets` command line option, which allows overriding defaults with a preset.
// (Normally, any explicit entries in 'defaults' will take precedence over any values from presets)
const overrideDefaultsWithPreset = ({confResolved, presetName}) => {
  V.ConfResolvedModel(confResolved)
  V.PresetNameModel(presetName)
  const conf = clone(confResolved)

  if(!conf.presets[presetName]) throw Error(`Preset '${presetName}' not found.`)

  Object.assign(conf.defaults, conf.presets[presetName])

  V.ConfResolvedModel(conf)
  return conf
}

// load vars definition from JSON file and perform basic validation
const rawFile = ({cwd = process.cwd(), confFilePath, debugLogger}) => {
  throwIfArgsBad(
    {
      cwd: [String],
      confFilePath: NonBlankStrModel,
      debugLogger: [DebugLoggerModel]
    },
    {cwd, confFilePath, debugLogger}
  )

  const dl = debugLogger

  const varFileFullPath = path.resolve(cwd, confFilePath)
  if(dl) {
    dl.group(`Reading vars file ${confFilePath}`)
    dl.debug(`Current working directory ${cwd}`)
    dl.debug(`Resolved full path: ${varFileFullPath}`)
  }

  const vars = readFileJSON(varFileFullPath, cwd)
  if(dl) {
    dl.group(`VARIABLE DEFINITIONS FROM ${varFileFullPath}`)
    dl.debugJson(vars)
    dl.groupEnd()
  }

  // Validate against model and return
  // File is allowed to be partial (i.e. only containing "defaults" or only containing "presets")
  return V.ConfRawPartialModel(vars)
}

const rawFiles = ({cwd = process.cwd(), confFilePaths, debugLogger}) => {
  throwIfArgsBad(
    {
      cwd: String,
      confFilePaths: defNonEmptyArrModel('ConfFilePaths', NonBlankStrModel),
      debugLogger: [DebugLoggerModel]
    },
    {cwd, confFilePaths, debugLogger}
  )
  return confFilePaths.map(confFilePath => rawFile({cwd, confFilePath, debugLogger}))
}

// load configurations from multiple JSON files, merge and perform basic validation
const readFilesAndMerge = ({cwd = process.cwd(), confFilePaths, debugLogger}) => {
  const configs = rawFiles({cwd, confFilePaths, debugLogger})
  return mergeConfigList({configs})
}

const readFilesAndResolve = ({cwd = process.cwd(), confFilePaths, debugLogger}) => {
  const mergedConf = readFilesAndMerge({cwd, confFilePaths, debugLogger})
  return resolveConfPresets(mergedConf, debugLogger)
}

const readFilesAndSubstitute = ({cwd = process.cwd(), confFilePaths, debugLogger}) => {
  const resolvedVarsDef = readFilesAndResolve({cwd, confFilePaths, debugLogger})
  return substituteVarSetXrefs(resolvedVarsDef.defaults, debugLogger)
}

// Process Configuration 'presets_use' directives
// Must first have been processed with mergeVars() to convert
// 'presets_add' / 'presets_omit'
const resolveConfPresets = (mergedConf) => {
  // validate
  V.ConfMergedModel(mergedConf)
  // flatten
  let flatConf = configFlatten(mergedConf)
  const keys = Object.keys(flatConf)
  for(const flatConfKey of keys) {
    flatConf = flatConfResolvePresets({
      flatConfKey,
      flatConf
    })
  }
  // restore shape
  const result = configUnflatten(flatConf)
  // validate result
  V.ConfResolvedModel(result)
  return result
}

const substituteOneValueXrefs = ({varName, oneValue, varSet, visited, debugLogger}) => {
  throwIfArgsBad(
    {
      varName: V.SubstVarNameModel,
      oneValue: NonBlankStrModel,
      varSet: V.VarSetSubstitutedModel,
      visited: V.SubstVarNameListModel,
      debugLogger: [DebugLoggerModel]
    },
    {varName, oneValue, varSet, visited, debugLogger}
  )

  let vSet = clone(varSet)

  const dl = debugLogger
  dl && dl.debug(`searching for $ expressions in value from ${varName}`)

  // need local copy of regex because we are using recursion and using the regex in a stateful way
  const SUBST_VAR_REGEX = clone(V.FIND_SUBST_VAR_REGEX)

  let finalValPieces = [oneValue]
  let done = false
  while(!done) {
    const match = SUBST_VAR_REGEX.exec(oneValue)
    if(match === null) {
      done = true
    } else {
      const foundVarExpression = match[0]
      dl && dl.debug(`found ${foundVarExpression}`)

      // remove dollar sign to get key
      const foundVarName = foundVarExpression.slice(1)
      if(!V.SubstVarNameModel.test(foundVarName)) throw Error(`Internal error processing substitution variables - bad match '${foundVarExpression}'`)

      const matchIndex = SUBST_VAR_REGEX.lastIndex
      const matchStart = matchIndex - foundVarExpression.length
      // recurse to parent function to process any substitution variables contained in finalVars[foundVarName] if needed
      vSet = substituteOneVarXrefs({
        varName: foundVarName,
        varSet: vSet,
        visited,
        debugLogger
      })

      // chop up the last element of finalValPieces to substitute in the value
      const foundVarValue = vSet[foundVarName]
      if(kindOf(foundVarValue) === 'null') throw Error(`substitution variable ${foundVarExpression} contains a null value (used in variable: ${varName})`)

      const lastPiece = finalValPieces.pop()
      const charsAlreadyProcessed = oneValue.length - lastPiece.length
      // push remaining unprocessed chars in varVal that are before the found substitution variable (unless empty string)
      const precedingChars = lastPiece.slice(
        0,
        matchStart - charsAlreadyProcessed
      )
      if(precedingChars.length > 0) finalValPieces.push(precedingChars)
      // push substituted value (might be an array)
      finalValPieces.push(foundVarValue)
      // push remaining chars in varVal after the found substitution variable
      const succeedingChars = lastPiece.slice(
        foundVarName.length + 1 + matchStart - charsAlreadyProcessed,
        oneValue.length
      )
      if(succeedingChars.length > 0) finalValPieces.push(succeedingChars)
    }
  }

  // done matching
  dl && dl.debug(`finished processing $ expressions for value from ${varName}`)
  // check if we have mix of strings and arrays
  const kinds = uniq(finalValPieces.map(kindOf))
  if(kinds.length > 1) throw Error(`variable ${varName} contains a mix of strings and arrays after processing $ substitutions`)

  const value = kinds[0] === 'array'
    ? flatten(finalValPieces)
    : finalValPieces.join('')

  return {value, varSet: vSet}
}

const substituteOneVarXrefs = ({varName, varSet, debugLogger, visited = []}) => {
  V.VarSetSubstitutedModel(varSet)
  V.SubstVarNameListModel(visited)

  const dl = debugLogger

  // clone to prevent accidental mutation of original
  let vSet = clone(varSet)

  if(visited.includes(varName)) throw Error(`substituteOneVarXrefs(): circular reference: ${flatten([visited, varName]).join(',')}`)

  // If a built-in var is requested, return it as value (escape any dollar signs)
  if(V.BUILT_IN_SUBST_VAR_NAMES.includes(varName)) {
    vSet[varName] = builtInSubstVarValue(varName)
    return vSet
  }

  if(!Object.keys(vSet).includes(varName)) throw Error(`Variable not found: ${varName}`)
  const varValue = vSet[varName]

  if(dl) {
    const redacted = redact({[varName]: varValue})
    dl.debug(`variable value: ${JSON.stringify(redacted[varName])}`)
  }

  if(kindOf(varValue) === 'null') {
    dl && dl.debug('value is null (contains no substitution variables')
    return vSet
  }

  if(kindOf(varValue) === 'array') {
    dl && dl.debug('value is an array, processing each element...')
    let newVal = []
    let newElem = null
    for(const elem of varValue) {
      dl && dl.debug(`processing array item '${elem}'`)
      const arrayElementResult = substituteOneValueXrefs({
        varName,
        oneValue: elem,
        finalVars: vSet,
        visited: [visited, varName].flat(),
        debugLogger
      })
      vSet = arrayElementResult.varSet
      newElem = arrayElementResult.value

      dl && dl.debug(`array item after substitutions: '${newElem}'`)
      newVal.push(newElem)
    }
    vSet[varName] = newVal
    dl && dl.debug(`array after substitutions: '${JSON.stringify(newVal)}'`)
  } else {
    const stringValResult = substituteOneValueXrefs({
      varName,
      oneValue: varValue,
      varSet: vSet,
      visited: [visited, varName].flat(),
      debugLogger
    })
    const newVal = stringValResult.value
    vSet = stringValResult.varSet
    vSet[varName] = newVal

    if(dl) {
      const redacted = redact({[varName]: newVal})
      dl.debug(`variable value after substitutions: ${JSON.stringify(redacted[varName])}`)
    }
  }
  V.VarSetSubstitutedModel(vSet)
  return vSet
}


// Returns a clone of VarSet with $var_name references within values replaced by corresponding entry under that key
// (without the leading '$') e.g. "libraryId" : "$mez_lib_id" will be converted to "libraryId": varSet.mez_lib_id
const substituteVarSetXrefs = (varSet, debugLogger) => {
  V.VarSetResolvedModel(varSet)
  let vSet = clone(varSet)

  const dl = debugLogger
  dl && dl.group('SUBSTITUTE VARIABLE CROSS-REFERENCES')

  for(const varName of Object.keys(vSet)) {
    if(dl) {
      dl.debug(`processing ${varName}`)
      const redacted = redact({[varName]: vSet[varName]})
      dl.debug(`initial value ${JSON.stringify(redacted[varName])}`)
    }
    vSet = substituteOneVarXrefs({
      varName,
      varSet: vSet,
      debugLogger
    })
    if(dl) {
      const redacted = redact({[varName]: vSet[varName]})
      dl.debug(`final value for ${varName}: ${JSON.stringify(redacted[varName])}`)
    }
  }

  dl && dl.groupEnd()
  return substitute$$(vSet)
}

const substitute$$ = map(
  val => kindOf(val) === 'string'
    ? val.replaceAll('$$', '$')
    : val
)

const configFlatten = conf => {
  // most lenient validation for Configuration
  V.ConfRawPartialModel(conf)

  const flatConfig = conf.defaults
    ? mergeDeepRight(conf.presets || {}, {defaults: conf.defaults})
    : conf.presets

  // most lenient validation for FlatConf
  V.FlatConfRawModel(flatConfig)
  return flatConfig
}

const configUnflatten = flatConfig => {
  // most lenient validation for FlatConf
  V.FlatConfRawModel(flatConfig)

  const conf = {
    defaults: flatConfig.defaults,
    presets: omit(['defaults'], flatConfig)
  }

  // most lenient validation for Configuration
  V.ConfRawModel(conf)
  return conf
}

module.exports = {
  builtInSubstVarValue,
  contextMerge,
  mergeConfigList,
  objToArgList,
  overrideDefaultsWithPreset,
  rawFiles,
  readFilesAndMerge,
  readFilesAndResolve,
  readFilesAndSubstitute,
  resolveConfPresets,
  substituteVarSetXrefs
}
