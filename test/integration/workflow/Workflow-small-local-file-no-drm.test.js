// Integration test for https://docs.eluv.io/docs/guides/media-ingest/workflow-examples/#small-local-file-no-drm

if (!process.env.ELVUTILS_CONFIG) throw Error('Env variable ELVUTILS_CONFIG must be set to run integration test')

const path = require('path')

const {runUtility} = require('../../../utilities/lib/helpers')

const {exampleABRProfilePath, exampleVideoPath, timestampFilename, utilityPath} = require('../../test-helpers')

const MasterCreate = require(utilityPath('MasterCreate.js'))
const MezCreate = require(utilityPath('MezCreate.js'))

const SmallLocalIngestNoDRM = async ({
  masterTitle,
  masterFiles,
  mezTitle,
  abrProfilePath
}) => {

  const env = {
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    FABRIC_CONFIG_URL: process.env.FABRIC_CONFIG_URL
  }

  const masterCreateResult = await runUtility(
    MasterCreate,
    [
      '--title', masterTitle,
      '--files', ...masterFiles
    ],
    env
  )

  const mezCreateResult = await runUtility(
    MezCreate,
    [
      '--title', mezTitle,
      '--masterHash', masterCreateResult.data.versionHash,
      '--abrProfile', abrProfilePath,
      '--wait'
    ],
    env
  )

  return {
    masterCreateResult,
    mezCreateResult
  }
}

const title = timestampFilename(path.basename(__filename))

const testParams = {
  masterTitle: title,
  masterFiles: [exampleVideoPath],
  mezTitle: title,
  abrProfilePath: exampleABRProfilePath('abr_profile_no_drm_store_clear.json')
}

describe(__filename, function () {
  this.timeout(0)
  it('should run successfully', async () => {
    await SmallLocalIngestNoDRM(testParams)
  })
})

