const assertAfterCheck = require('@eluvio/elv-js-helpers/ModelAssertion/assertAfterCheck')
const base58Decode = require('@eluvio/elv-js-helpers/Conversion/base58Decode')
const isBase58String = require('@eluvio/elv-js-helpers/Boolean/isBase58String')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const passesModelCheck = require('@eluvio/elv-js-helpers/Boolean/passesModelCheck')

const ObjectIdModel = NonBlankStrModel.extend()
  .assert(
    ...assertAfterCheck(
      passesModelCheck(NonBlankStrModel),
      s => s.startsWith('iq__'),
      'is not a valid Object ID (must start with "iq__")'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && s.startsWith('iq__'),
      s => isBase58String(s.slice(4)),
      'is not a valid Object ID (does not have a valid Base-58 string after "iq__")'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && s.startsWith('iq__') && isBase58String(s.slice(4)),
      s => base58Decode(s.slice(4)).length === 40,
      'is not a valid Object ID (does not encode a 20-byte address)'
    )
  )
  .as('ObjectId')

module.exports = ObjectIdModel

