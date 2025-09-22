'use strict'
const assertMatchesRegex = require('@eluvio/elv-js-helpers/ModelAssertion/assertMatchesRegex')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const PathStringModel = NonBlankStrModel.extend()
  .assert(
    ...assertMatchesRegex(
      NonBlankStrModel,
      /\/.*/,
      'is not a valid path (must start with \'/\' and contain no newline characters)'
    )
  )
  .as('PathString')

module.exports = PathStringModel
