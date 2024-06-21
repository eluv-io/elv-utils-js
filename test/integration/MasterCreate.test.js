// Integration test for https://docs.eluv.io/docs/guides/media-ingest/elv-utils-js/utilities/#mastercreatejs

const {exampleVideoPath, requireUtility, runUtilityTest, timestampFilename} = require('../test-helpers')

const MasterCreate = requireUtility('MasterCreate.js')

describe(__filename, function () {
  this.timeout(0)
  it('should run successfully', async () => {
    const title = timestampFilename(__filename)

    await runUtilityTest(
      MasterCreate,
      [
        '--title', title,
        '--files', exampleVideoPath
      ],
      {}
    )
  })
})

