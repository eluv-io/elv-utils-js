// Integration test for https://docs.eluv.io/docs/guides/media-ingest/elv-utils-js/utilities/#mastercreatejs
'use strict'
const TH = require('../../test-helpers.js')

const testConfig = TH.elvUtilsConfigVals()

const MasterCreate = TH.requireUtility('MasterCreate.js')

describe('MasterCreate.js', () => {

  it('should create a master object successfully', async function() {
    this.timeout(30000)
    const mc = new MasterCreate({
      argList: [
        '--title', TH.timestampFilename(__filename) + ' create finalized master',
        '--libraryId', testConfig.masterLib,
        '--files', TH.exampleVideoPath
      ]
    })

    const result = await mc.run()
    result.data.objectId.should.not.be.null
    result.data.versionHash.should.not.be.null
    TH.expect(result.data.writeToken).to.be.undefined
  })

  it('should create an unfinalized master object successfully', async function() {
    this.timeout(30000)
    const mc = new MasterCreate({
      argList: [
        '--title', TH.timestampFilename(__filename) + ' create unfinalized master',
        '--libraryId', testConfig.masterLib,
        '--files', TH.exampleVideoPath,
        '--noFinalize'
      ]
    })

    const result = await mc.run()
    result.data.objectId.should.not.be.null
    result.data.writeToken.should.not.be.null
    TH.expect(result.data.versionHash).to.be.undefined
  })
})
