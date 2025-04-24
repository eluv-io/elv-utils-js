// Integration test for PartsUpload.js (no documentation page yet)
'use strict'
const TH = require('../../test-helpers.js')
const ITH = require('../integration-test-helpers.js')

const PartsUpload = TH.requireUtility('PartsUpload')

const testConfig = TH.elvUtilsConfigVals({presetNames:['s3']})

describe('PartsUpload.js', () => {

  it('should upload parts from S3 to a draft successfully', async function() {

    this.timeout(15000)

    const draftInfo = await ITH.createDraft({
      name: TH.timestampFilename(__filename) + ' draft',
      libraryId: testConfig.mezLib
    })

    const writeToken = draftInfo.writeToken

    const pUpload = new PartsUpload({
      argList: [
        '--files', TH.exampleVideoPath,
        '--writeToken', writeToken
      ]
    })
    const result = await pUpload.run()
    TH.expect(result.data.versionHash).to.be.undefined
    result.data.writeToken.should.equal(writeToken)

    console.log(JSON.stringify(result,null,2))
  })

})

