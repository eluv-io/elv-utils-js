// Integration test for https://docs.eluv.io/docs/guides/media-ingest/elv-utils-js/utilities/#mastercreatejs

if (!process.env.ELVUTILS_CONFIG) throw Error('Env variable ELVUTILS_CONFIG must be set to run integration test')

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

