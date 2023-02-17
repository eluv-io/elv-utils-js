const TH = require('../test-helpers')

const utilityList = [
  'FilesAdd.js',
  'FilesDownload.js',
  'FilesProbe.js',
  'ImageSet.js',
  'LibraryInfo.js',
  'LibraryListObjects.js',
  'ListAccessGroups.js',
  'ListFiles.js',
  'ListLibraries.js',
  'ListParts.js',
  'ListTypes.js',
  'ListVersions.js',
  'LROStatus.js',
  'LROStop.js',
  'MasterAddVariant.js',
  'MasterCopyVariant.js',
  'MasterCreate.js',
  'MasterDeleteVariant.js',
  'MasterMakeDefaultVariant.js',
  'MasterUpdateSources.js',
  'MetaCopy.js',
  'MetaDelete.js',
  'MetaGet.js',
  'MetaMove.js',
  'MetaSet.js',
  'MezCopyOffering.js',
  'MezCreate.js',
  'MezDeleteOffering.js',
  'MezJobCancel.js',
  'MezJobStatus.js',
  'MezRegenDrmKeys.js',
  'MezSetCodecDescs.js',
  'MezUnifyAudioDrmKeys.js',
  'ObjectAddGroupPerm.js',
  'ObjectCreate.js',
  'ObjectCreateDraft.js',
  'ObjectDelete.js',
  'ObjectDeleteVersion.js',
  'ObjectGetPermission.js',
  'ObjectListGroupPerms.js',
  'ObjectPruneVersions.js',
  'ObjectRemoveGroupPerm.js',
  'ObjectSetPermission.js',
  'ObjectSetType.js',
  'OfferingAddSubtitles.js',
  'OfferingDeleteStream.js',
  'OfferingSetFormats.js',
  'OfferingSetImageWatermark.js',
  'OfferingSetTextWatermark.js',
  'SimpleIngest.js',
  'TypeGet.js',
  'VariantAddStream.js',
  'VariantDeleteStream.js',
  'VariantEditStream.js',
  'WriteTokenInfo.js'
]

describe('utilities', () => {
  for (const u of utilityList) {
    it(`${u} should return argMap successfully`, () => {
      const klass = TH.requireUtility(u)
      klass.argMap()
    })
  }
})

describe('concerns', () => {
  for (const u of utilityList) {
    it(`${u} should return argMap successfully`, () => {
      const klass = TH.requireUtility(u)
      klass.argMap()
    })
  }
})
