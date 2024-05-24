// Integration test for https://docs.eluv.io/docs/guides/media-ingest/workflow-examples/#small-local-file-no-drm

if (!process.env.ELVUTILS_CONFIG) throw Error('Env variable ELVUTILS_CONFIG must be set to run integration test')

const path = require('path')

const {runUtility} = require('../../utilities/lib/helpers')

const {exampleABRProfilePath, exampleVideoPath, utilityPath} = require('../test-helpers')

const MasterCreate = require(utilityPath('MasterCreate.test.js'))
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
      '--masterHash', masterCreateResult.data.version_hash,
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

const testParams = {
  masterTitle: path.basename(__filename),
  masterFiles: [exampleVideoPath],
  mezTitle: path.basename(__filename),
  abrProfilePath: exampleABRProfilePath('abr_profile_no_drm_store_clear.json')
}

SmallLocalIngestNoDRM(testParams).then(
  successValue => {
    console.log(`Mez object: ${successValue.mezCreateResult.data.object_id}`)
  },
  failureReason => {
    throw Error(failureReason)
  }
)