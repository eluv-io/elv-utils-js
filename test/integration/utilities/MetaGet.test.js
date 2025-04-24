// Integration test for https://docs.eluv.io/docs/guides/media-ingest/elv-utils-js/utilities/#metagetjs
'use strict'
const TH = require('../../test-helpers.js')
const ITH = require('../integration-test-helpers.js')

const MetaGet = TH.requireUtility('MetaGet')
const MetaSet = TH.requireUtility('MetaSet')

const testConfig = TH.elvUtilsConfigVals()

const SAMPLE_METADATA = {
  key_a: 'value_a',
  key_b: {
    key_ba: 'value_ba',
    key_bb: [
      'value_bb_0',
      'value_bb_1'
    ]
  }
}

describe('MetaGet.js', () => {

  it('should retrieve metadata from a draft successfully, from a finalized object successfully, and error if draft not found', async function () {
    this.timeout(60000)

    const draftInfo = await ITH.createDraft({
      name: TH.timestampFilename(__filename) + ' draft',
      libraryId: testConfig.mezLib,
      metadata: JSON.stringify(SAMPLE_METADATA)
    })

    const writeToken = draftInfo.writeToken
    writeToken.length.should.be.greaterThan(0)
    const objectId = draftInfo.objectId
    objectId.length.should.be.greaterThan(0)

    // read all metadata from draft
    const mg1 = new MetaGet({
      argList: [
        '--writeToken', writeToken
      ]
    })

    const mgResult1 = await mg1.run()
    TH.chai.assert.deepEqual(
      mgResult1.data.metadata.key_a,
      SAMPLE_METADATA.key_a
    )
    TH.chai.assert.deepEqual(
      mgResult1.data.metadata.key_b,
      SAMPLE_METADATA.key_b
    )
    TH.expect(mgResult1.data.metadata.public).to.not.be.undefined

    // alter metadata in draft and finalize

    const ms = new MetaSet({
      argList: [
        '--writeToken', writeToken,
        '--path', '/key_b/key_bb/0',
        '--metadata', '""value_bb_0_changed""',
        '--force',
        '--finalize',
        '--commitMsg', 'Change metadata /key_b/key_bb/0 to "value_bb_0_changed"'
      ]
    })
    await ms.run()

    // read specific metadata path from finalized object
    const mg2 = new MetaGet({
      argList: [
        '--objectId', objectId,
        '--path', '/key_b/key_bb/0'
      ]
    })

    const mgResult2 = await mg2.run()
    mgResult2.data.metadata.should.equal('value_bb_0_changed')

    // Try to read metadata from write token after finalization. Expect error
    const readFinalizedWriteTokenResult = await mg1.run()
    readFinalizedWriteTokenResult.exitCode.should.not.equal(0)
    readFinalizedWriteTokenResult.failureReason.should.match(/^Write token .+ not found/)

  })
})

