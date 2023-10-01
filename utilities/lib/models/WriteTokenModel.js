const Utils = require('@eluvio/elv-client-js/src/Utils')

const assertAfterCheck = require('@eluvio/elv-js-helpers/ModelAssertion/assertAfterCheck')
const isBase58String = require('@eluvio/elv-js-helpers/Boolean/isBase58String')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const passesModelCheck = require('@eluvio/elv-js-helpers/Boolean/passesModelCheck')
const throwsException = require('@eluvio/elv-js-helpers/Boolean/throwsException')

const correctPrefix = s => s.startsWith('tqw__')
const decodesCorrectly = s => !throwsException(() => Utils.DecodeWriteToken(s))
const suffixIsBase58 = s => isBase58String(s.slice(5))



const WriteTokenModel = NonBlankStrModel.extend()
  .assert(
    ...assertAfterCheck(
      passesModelCheck(NonBlankStrModel),
      correctPrefix,
      'is not a valid Write Token (must start with "tqw__")'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && correctPrefix(s),
      suffixIsBase58,
      'is not a valid Write Token (does not have a valid Base-58 string after "tqw__")'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && correctPrefix(s) && suffixIsBase58(s),
      decodesCorrectly,
      'is not a valid Write Token (decode failed)'
    )
  )
  .as('WriteToken')

module.exports = WriteTokenModel

