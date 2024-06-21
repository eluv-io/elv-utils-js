// Integration test for https://docs.eluv.io/docs/guides/media-ingest/elv-utils-js/utilities/#simpleingestjs

const {
  exampleVideoPath,
  elvUtilsConfigResolved,
  requireUtility,
  runUtilityTest,
  timestampFilename
} = require('../test-helpers')

const SimpleIngest = requireUtility('SimpleIngest.js')
const MetaSet = requireUtility('MetaSet.js')

const config = elvUtilsConfigResolved()

const abrProfile = require(config.abrProfile)

const libAbrMetadata = {
  mez_content_type: config.mezType,
  default_profile: abrProfile,
  mez_manage_groups: [config.groupAddress],
  mez_permission_level: 'editable'
}

describe(__filename, function () {
  this.timeout(0)
  it('should run successfully', async () => {
    const title = timestampFilename(__filename)

    // make sure library has needed metadata for SimpleIngest
    await runUtilityTest(
      MetaSet,
      [
        '--libraryId', config.mezLib,
        '--metadata', JSON.stringify(libAbrMetadata),
        '--path', '/abr',
        '--commitMsg', 'Set metadata for SimpleIngest.js',
        '--force'
      ],
      {}
    )

    await runUtilityTest(
      SimpleIngest,
      [
        '--libraryId', config.mezLib,
        '--title', title,
        '--files', exampleVideoPath
      ],
      {}
    )
  })
})

