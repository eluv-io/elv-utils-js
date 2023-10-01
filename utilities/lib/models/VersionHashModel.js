const Utils = require('@eluvio/elv-client-js/src/Utils')

const assertAfterCheck = require('@eluvio/elv-js-helpers/ModelAssertion/assertAfterCheck')
const isBase58String = require('@eluvio/elv-js-helpers/Boolean/isBase58String')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const passesModelCheck = require('@eluvio/elv-js-helpers/Boolean/passesModelCheck')
const throwsException = require('@eluvio/elv-js-helpers/Boolean/throwsException')

const VersionHashModel = NonBlankStrModel.extend()
  .assert(
    ...assertAfterCheck(
      passesModelCheck(NonBlankStrModel),
      s => s.startsWith('hq__'),
      'is not a valid Version Hash (must start with "hq__")'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && s.startsWith('hq__'),
      s => isBase58String(s.slice(4)),
      'is not a valid Version Hash (does not have a valid Base-58 string after "hq__")'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && s.startsWith('hq__') && isBase58String(s.slice(4)),
      s => !throwsException(() => Utils.DecodeVersionHash(s)),
      'is not a valid Version Hash (decode failed)'
    )
  )
  .as('VersionHash')

module.exports = VersionHashModel

