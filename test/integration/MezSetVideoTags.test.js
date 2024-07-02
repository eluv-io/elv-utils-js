// Integration test for MezSetVideoTags.js (doc page not created yet)

if (!process.env.ELVUTILS_CONFIG) throw Error('Env variable ELVUTILS_CONFIG must be set to run integration test')

const {
  exampleVideoTagsPath,
  exampleVideoPath,
  requireUtility,
  timestampFilename
} = require('../test-helpers')

const path = require('path')

const {runUtility} = require('../../utilities/lib/helpers')

const MasterCreate = requireUtility('MasterCreate.js')
const MezCreate = requireUtility('MezCreate.js')
const MezSetVideoTags = requireUtility('MezSetVideoTags.js')

const Test = async ({
  title,
  masterFiles,
  tagsFilePath
}) => {

  const env = {
    ELVUTILS_CONFIG: process.env.ELVUTILS_CONFIG
  }

  const masterCreateResult = await runUtility(
    MasterCreate,
    [
      '--title', title,
      '--files', ...masterFiles
    ],
    env
  )

  const mezCreateResult = await runUtility(
    MezCreate,
    [
      '--title', title,
      '--masterHash', masterCreateResult.data.versionHash,
      '--wait'
    ],
    env
  )

  const mezSetVideoTagsResult = await runUtility(
    MezSetVideoTags,
    [
      '--objectId', mezCreateResult.data.objectId,
      '--tags', tagsFilePath
    ],
    env
  )

  return {
    masterCreateResult,
    mezCreateResult,
    mezSetVideoTagsResult
  }
}

const title = timestampFilename(path.basename(__filename))

const testParams = {
  title,
  masterFiles: [exampleVideoPath],
  tagsFilePath: exampleVideoTagsPath
}

describe(__filename, function () {
  this.timeout(0)
  it('should run successfully', async () => {
    await Test(testParams)
  })
})
