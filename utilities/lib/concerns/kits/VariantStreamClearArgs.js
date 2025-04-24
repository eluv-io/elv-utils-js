// arguments for clearing fields in variant streams
'use strict'
const clone = require('@eluvio/elv-js-helpers/Functional/clone')
const pick = require('@eluvio/elv-js-helpers/Functional/pick')

const ArgClearChannelIndex = require('../args/ArgClearChannelIndex')
const ArgClearDeinterlace = require('../args/ArgClearDeinterlace')
const ArgClearLanguage = require('../args/ArgClearLanguage')
const ArgClearMapping = require('../args/ArgClearMapping')
const ArgClearMultipliers = require('../args/ArgClearMultipliers')
const ArgClearTargetFrameRate = require('../args/ArgClearTargetFrameRate')
const ArgClearTargetTimebase = require('../args/ArgClearTargetTimebase')

const blueprint = {
  name: 'VariantStreamClearArgs',
  concerns: [
    ArgClearChannelIndex,
    ArgClearDeinterlace,
    ArgClearLanguage,
    ArgClearMapping,
    ArgClearMultipliers,
    ArgClearTargetFrameRate,
    ArgClearTargetTimebase
  ]
}

const New = context => {

  const apply = variantStreamOptions => {
    const result = clone(variantStreamOptions)
    if(context.args.clearChannelIndex) delete result.channelIndex
    if(context.args.clearDeinterlace) delete result.deinterlace
    if(context.args.clearLanguage) delete result.language
    if(context.args.clearMapping) delete result.mapping
    if(context.args.clearMultipliers) delete result.multipliers
    if(context.args.clearTargetFrameRate) delete result.target_frame_rate
    if(context.args.clearTargetTimebase) delete result.target_timebase
    return result
  }

  // pick out just the args relevant for clearing fields in a variant stream and return
  const optsFromArgs = () => pick(
    [
      'clearChannelIndex',
      'clearDeinterlace',
      'clearLanguage',
      'clearMapping',
      'clearMultipliers',
      'clearTargetFrameRate',
      'clearTargetTimebase'
    ],
    context.args
  )

  // instance interface
  return {
    apply,
    optsFromArgs
  }
}

module.exports = {
  blueprint,
  New
}
