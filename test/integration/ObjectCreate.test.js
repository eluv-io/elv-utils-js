// Integration test for https://docs.eluv.io/docs/guides/media-ingest/elv-utils-js/utilities/#objectcreatejs

const {expect, elvUtilsConfigResolved, requireUtility, runUtilityTest, timestampFilename} = require('../test-helpers')
const path = require('path')

const ObjectCreate = requireUtility('ObjectCreate.js')

const config = elvUtilsConfigResolved()

describe(__filename, function () {
  this.timeout(0)
  it('should run successfully', async () => {
    const title = timestampFilename(path.basename(__filename))
    const result = await runUtilityTest(
      ObjectCreate,
      [
        '--libraryId', config.mezLib,
        '--name', title
      ],
      {}
    )
    console.log(JSON.stringify(result,null,0))
    result.data.versionHash.should.not.be.null
  })

  it('should error if --libraryId is missing', async () => {
    await runUtilityTest(
      ObjectCreate,
      [
        '--name', 'foo'
      ],
      {}
    ).catch((error) => expect(error.message).to.equal('Missing required argument: libraryId'))
  })
})

