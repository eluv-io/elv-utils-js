'use strict'
const assertAfterCheck = require('@eluvio/elv-js-helpers/ModelAssertion/assertAfterCheck')
const base58Decode = require('@eluvio/elv-js-helpers/Conversion/base58Decode')
const isBase58String = require('@eluvio/elv-js-helpers/Boolean/isBase58String')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const passesModelCheck = require('@eluvio/elv-js-helpers/Boolean/passesModelCheck')

const LibraryIdModel = NonBlankStrModel.extend()
  .assert(
    ...assertAfterCheck(
      passesModelCheck(NonBlankStrModel),
      s => s.startsWith('ilib'),
      'is not a valid Library ID (must start with "ilib")'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && s.startsWith('ilib'),
      s => isBase58String(s.slice(4)),
      'is not a valid Library ID (does not have a valid Base-58 string after "ilib")'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && s.startsWith('ilib') && isBase58String(s.slice(4)),
      s => base58Decode(s.slice(4)).length === 20,
      'is not a valid Library ID (does not encode a 20-byte address)'
    )
  )
  .as('LibraryId')

module.exports = LibraryIdModel