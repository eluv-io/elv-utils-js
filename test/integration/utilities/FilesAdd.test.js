// Integration test for https://docs.eluv.io/docs/guides/media-ingest/elv-utils-js/utilities/#filesadd
'use strict'
const TH = require('../../test-helpers.js')
const ITH = require('../integration-test-helpers.js')

const FilesAdd = TH.requireUtility('FilesAdd')

const testConfig = TH.elvUtilsConfigVals({presetNames:['s3']})

describe('FilesAdd.js', () => {

  it('should upload from S3 to a draft successfully', async function() {

    this.timeout(15000)

    const draftInfo = await ITH.createDraft({
      name: TH.timestampFilename(__filename) + ' draft',
      libraryId: testConfig.mezLib
    })

    const writeToken = draftInfo.writeToken

    const fa = new FilesAdd({
      argList: [
        '--presets', 's3',
        '--files', testConfig.testFilePath,
        '--writeToken', writeToken,
        '--s3Copy'
      ]
    })
    const result = await fa.run()
    TH.expect(result.data.versionHash).to.be.undefined
    result.data.writeToken.should.equal(writeToken)

    const fileList = await ITH.getFileList({writeToken})
    fileList.length.should.equal(1)
    fileList[0].path.should.equal('/video.mp4')
    fileList[0].size.should.equal(3821124)
    fileList[0].encrypted.should.be.true
  })

})

