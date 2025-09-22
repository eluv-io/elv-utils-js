'use strict'
const Utils = require('@eluvio/elv-client-js/src/Utils')

const assertAfterCheck = require('@eluvio/elv-js-helpers/ModelAssertion/assertAfterCheck')
const isBase58String = require('@eluvio/elv-js-helpers/Boolean/isBase58String')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const passesModelCheck = require('@eluvio/elv-js-helpers/Boolean/passesModelCheck')
const throwsException = require('@eluvio/elv-js-helpers/Boolean/throwsException')

const ObjectIdModel = require('./ObjectIdModel')

const WriteTokenModel = NonBlankStrModel.extend()
  .assert(
    ...assertAfterCheck(
      passesModelCheck(NonBlankStrModel),
      s => s.startsWith('tqw__'),
      'is not a valid Write Token (must start with "tqw__")'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && s.startsWith('tqw__'),
      s => isBase58String(s.slice(5)),
      'is not a valid Write Token (does not have a valid Base-58 string after "tqw__")'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && s.startsWith('tqw__') && isBase58String(s.slice(5)),
      s => !throwsException(() => Utils.DecodeWriteToken(s)),
      'is not a valid Write Token (decode failed)'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(NonBlankStrModel, s) && s.startsWith('tqw__') && isBase58String(s.slice(5)) && !throwsException(() => Utils.DecodeWriteToken(s)),
      s => !throwsException(() => ObjectIdModel(Utils.DecodeWriteToken(s).objectId)),
      'is not a valid Write Token (decoded object id failed validation)'
    )
  )
  .as('WriteToken')

module.exports = WriteTokenModel

