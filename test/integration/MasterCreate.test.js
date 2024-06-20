// Integration test for https://docs.eluv.io/docs/guides/media-ingest/elv-utils-js/utilities/#mastercreatejs

const {exampleVideoPath, requireUtility, runUtilityTest, timestampFilename} = require('../test-helpers')

const MasterCreate = requireUtility('MasterCreate.js')

describe(__filename, function () {
  this.timeout(0)
  it('should run successfully', async () => {
    await runUtilityTest(
      MasterCreate,
      [
        '--title', timestampFilename(__filename),
        '--files', exampleVideoPath
      ],
      {}
    )
  })
})

