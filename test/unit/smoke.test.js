const {standardUtilityFilenames} = require('../../utilities/lib/helpers')

const TH = require('../test-helpers')

describe('utilities', function () {
  this.timeout(0)
  for (const u of standardUtilityFilenames()) {
    it(`${u} should return argMap successfully`, () => {
      const klass = TH.requireUtility(u)
      klass.argMap()
    })
  }
})

describe('concerns', function () {
  this.timeout(0)
  for (const u of TH.concernList()) {
    it(`${u} should load successfully`, () => {
      TH.requireConcern(u)
    })
  }
})

describe('concerns as utilities', function () {
  this.timeout(0)
  for (const u of TH.concernList()) {
    it(`${u} should successfully load as a utility`, () => {
      const klass = TH.concern2utility(TH.requireConcern(u), [])
      klass.argMap()
    })
  }
})
