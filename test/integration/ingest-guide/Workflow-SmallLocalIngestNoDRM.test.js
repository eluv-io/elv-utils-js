// Integration test for https://docs.eluv.io/docs/guides/media-ingest/workflow-examples/#small-local-file-no-drm
'use strict'
const path = require('path')

const TH = require('../../test-helpers.js')

const MasterCreate = TH.requireUtility('MasterCreate.js')
const MezCreate = TH.requireUtility('MezCreate.js')

describe('Workflow-SmallLocalIngestNoDRM', () => {

  it('should execute successfully', async function () {
    this.timeout(120000)

    const mastCreate = new MasterCreate({
      argList: [
        '--title', path.basename(__filename),
        '--files', TH.exampleVideoPath
      ]
    })

    const mastCreateResult = await mastCreate.run()
    mastCreateResult.data.versionHash.should.not.be.null

    const mezCreate = new MezCreate({
      argList: [
        '--title', path.basename(__filename),
        '--masterHash', mastCreateResult.data.version_hash,
        '--abrProfile', TH.exampleABRProfilePath('abr_profile_no_drm_store_clear.json'),
        '--wait'
      ]
    })

    const mezCreateResult = await mezCreate.run()
    mezCreateResult.data.objectId.should.not.be.null
    mezCreateResult.data.versionHash.should.not.be.null
  })

})

