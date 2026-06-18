'use strict'
const assertAfterCheck = require('@eluvio/elv-js-helpers/ModelAssertion/assertAfterCheck')
const base58Decode = require('@eluvio/elv-js-helpers/Conversion/base58Decode')
const isBase58String = require('@eluvio/elv-js-helpers/Boolean/isBase58String')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const passesModelCheck = require('@eluvio/elv-js-helpers/Boolean/passesModelCheck')

const PartHashModel = NonBlankStrModel.extend()
  .assert(
    ...assertAfterCheck(
      passesModelCheck(NonBlankStrModel),
      s => s.startsWith('hqp_') || s.startsWith('hqpe'),
      'is not a valid Part Hash (must start with "hqp_" or "hqpe")'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && (s.startsWith('hqp_') || s.startsWith('hqpe')),
      s => isBase58String(s.slice(4)),
      'is not a valid Part Hash (does not have a valid Base-58 string after "hqp_" or "hqpe" prefix)'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && (s.startsWith('hqp_') || s.startsWith('hqpe')) && isBase58String(s.slice(4)),
      s => base58Decode(s.slice(4)).length === 35,
      'is not a valid Part Hash (does not encode a 35-byte value)'
    )
  )
  .as('PartHash')

module.exports = PartHashModel

PartHashModel('hqpeHUshsuD2KJwbtAdZkEzPR2VutsLHREeUh7UPK7jYpZjgFebh')