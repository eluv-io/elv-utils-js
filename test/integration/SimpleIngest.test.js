// Integration test for https://docs.eluv.io/docs/guides/media-ingest/elv-utils-js/utilities/#simpleingestjs

const {
  exampleABRProfilePath,
  exampleVideoPath,
  localDevTenantInfo,
  requireUtility,
  runUtilityTest,
  timestampFilename
} = require('../test-helpers')

const SimpleIngest = requireUtility('SimpleIngest.js')
const MetaSet = requireUtility('MetaSet.js')

const abrProfile = require(exampleABRProfilePath('abr_profile_both'))

const libAbrMetadata = {
  mez_content_type: localDevTenantInfo.mezType,
  default_profile: abrProfile,
  mez_manage_groups: [localDevTenantInfo.groupAddress],
  mez_permission_level: 'editable'
}

describe(__filename, function () {
  this.timeout(0)
  it('should run successfully', async () => {
    // make sure library has needed metadata for SimpleIngest
    await runUtilityTest(
      MetaSet,
      [
        '--libraryId', localDevTenantInfo.mezLib,
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
        '--libraryId', localDevTenantInfo.mezLib,
        '--title', timestampFilename(__filename),
        '--files', exampleVideoPath
      ],
      {}
    )
  })
})

