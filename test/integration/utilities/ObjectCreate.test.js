// Integration test for https://docs.eluv.io/docs/guides/media-ingest/elv-utils-js/utilities/#objectcreatejs
'use strict'
const TH = require('../../test-helpers.js')

const ObjectCreate = TH.requireUtility('ObjectCreate')

const testConfig = TH.elvUtilsConfigVals()

describe('ObjectCreate.js', () => {

  it('should create a draft successfully', async function() {
    this.timeout(5000)
    const oc = new ObjectCreate({
      argList: [
        '--name', TH.timestampFilename(__filename) + ' create draft',
        '--libraryId', testConfig.mezLib,
        '--noFinalize'
      ]
    })

    const result = await oc.run()
    result.data.objectId.should.not.be.null
    result.data.writeToken.should.not.be.null
    TH.expect(result.data.versionHash).to.be.undefined
  })

  it('should create a finalized object successfully', async function () {
    this.timeout(15000)
    const oc = new ObjectCreate({
      argList: [
        '--name', TH.timestampFilename(__filename) + ' create finalized object',
        '--libraryId', testConfig.mezLib,
      ]
    })

    const result = await oc.run()
    result.data.objectId.should.not.be.null
    TH.expect(result.data.writeToken).to.be.undefined
    result.data.versionHash.should.not.be.null
  })
})

