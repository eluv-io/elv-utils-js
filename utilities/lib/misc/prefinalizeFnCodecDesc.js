const R = require('@eluvio/ramda-fork')

const Utils = require('@eluvio/elv-client-js/src/Utils')

const setCodecDescs = require('./setCodecDescs')

const preFinalizeFn = async ({elvClient, nodeUrl, writeToken}) => {

  const objectId = Utils.DecodeWriteToken(writeToken).objectId
  const libraryId = await elvClient.ContentObjectLibraryId({objectId})

  // make sure client knows proper node to contact
  elvClient.HttpClient.RecordWriteToken(writeToken, nodeUrl)

  // get /abr_mezzanine/offerings/ metadata from draft, find out what offering(s) need processing
  const abrMezOfferingsMetadata = await elvClient.ContentObjectMetadata({
    libraryId,
    metadataSubtree: '/abr_mezzanine/offerings',
    objectId,
    writeToken
  })

  if(!abrMezOfferingsMetadata) throw Error('codecDescPrefinalizeFn: null metadata /abr_mezzanine/offerings from draft')
  const abrMezOffKeys = Object.keys(abrMezOfferingsMetadata)
  if(abrMezOffKeys.length === 0) throw Error('codecDescPrefinalizeFn: draft\'s /abr_mezzanine/offerings metadata is empty')

  // get final /offerings/ metadata from draft
  const offeringsMetadata = await elvClient.ContentObjectMetadata({
    libraryId,
    metadataSubtree: '/offerings',
    objectId,
    writeToken
  })

  if(!offeringsMetadata) throw Error('codecDescPrefinalizeFn: null metadata /offerings from draft')

  // revise offerings that were worked on
  const newOfferingsMetadata = R.clone(offeringsMetadata)
  for(const offeringKey of abrMezOffKeys) {
    const offeringMetadata = offeringsMetadata[offeringKey]
    if(!offeringMetadata) throw Error(`Offering '${offeringKey}' from /abr_mezzanine/offerings not found in /offerings`)
    newOfferingsMetadata[offeringKey] = await setCodecDescs({
      elvClient,
      libraryId,
      objectId,
      offeringKey,
      offeringMetadata,
      writeToken
    })
  }

  // write metadata back to draft
  await elvClient.ReplaceMetadata({
    libraryId,
    metadata: newOfferingsMetadata,
    metadataSubtree: '/offerings',
    objectId,
    writeToken
  })
}

module.exports = preFinalizeFn
