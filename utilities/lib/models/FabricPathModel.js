const assertAfterCheck = require('@eluvio/elv-js-helpers/ModelAssertion/assertAfterCheck')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')
const passesModelCheck = require('@eluvio/elv-js-helpers/Boolean/passesModelCheck')
const StringModel = require('@eluvio/elv-js-helpers/Model/StringModel')

// path to a file or directory in object
// same as 'FabricFilePathModel' except that '/' by itself is valid
const FabricPathModel = NonBlankStrModel.extend()
  .assert(
    ...assertAfterCheck(
      passesModelCheck(StringModel),
      s => s.startsWith('/'),
      'must start with a slash (/)'
    )
  ).assert(
    ...assertAfterCheck(
      s => passesModelCheck(StringModel, s) && s.startsWith('/'),
      s => s === '/' || !s.endsWith('/'),
      'cannot end with a slash (/) unless it is just "/"'
    )
  )
  .as('FabricPathModel')

module.exports = FabricPathModel

