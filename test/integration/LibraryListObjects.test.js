// Integration test for https://docs.eluv.io/docs/guides/media-ingest/elv-utils-js/utilities/#librarylistobjectsjs

const {elvUtilsConfigResolved, requireUtility, runUtilityTest, expect} = require('../test-helpers')

const LibraryListObjects = requireUtility('LibraryListObjects.js')

const config = elvUtilsConfigResolved()

describe(__filename, function () {
  this.timeout(0)
  it('should run successfully', async () => {
    await runUtilityTest(
      LibraryListObjects,
      [
        '--libraryId', config.mezLib,
        '--date',
        '--hash',
        '--name',
        '--size'
      ],
      {}
    )
  })

  it('should error if --libraryId is missing', async () => {
    await runUtilityTest(
      LibraryListObjects,
      [],
      {}
    ).catch((error) => expect(error.message).to.equal('Missing required argument: libraryId'))
  })

})

