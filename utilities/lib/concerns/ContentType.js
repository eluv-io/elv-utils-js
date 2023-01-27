// code related to Content Types
const compare = require('@eluvio/elv-js-helpers/Functional/compare')
const pick = require('@eluvio/elv-js-helpers/Functional/pick')

const {fabricItemDesc} = require('../helpers')

const Client = require('./Client')
const Logger = require('./Logger')

const blueprint = {
  name: 'ContentType',
  concerns: [Client, Logger]
}

const New = context => {
  const logger = context.concerns.Logger

  const forItem = async ({libraryId, objectId, versionHash}) => {
    const client = await context.concerns.Client.get()
    logger.log(`Looking up content type for ${fabricItemDesc({objectId, versionHash})}...`)
    const response = await client.ContentObject({libraryId, objectId, versionHash})
    logger.log(`Found: ${response.type}`)
    return response.type
  }

  const list = async () => {
    const client = await context.concerns.Client.get()
    const response = await client.ContentTypes()
    return Object.values(response).map(pick(['id','name'])).sort((a,b) => compare(a.name.toLowerCase(),b.name.toLowerCase()))
  }

  // look up a content type by name, id, or hash and return hash
  const refToVersionHash = async ({typeRef}) => {
    const client = await context.concerns.Client.get()

    if(!typeRef) throw Error('ContentType.refToVersionHash() - typeRef missing')

    let fieldName = 'name'
    if(typeRef.startsWith('iq__')) {
      fieldName = 'typeId'
    } else if(typeRef.startsWith('hq__')) {
      fieldName = 'versionHash'
    }
    logger.log(`Looking up content type: ${typeRef}...`)
    const contentType = await client.ContentType({[fieldName]: typeRef})
    if(!contentType) throw Error(`Unable to find content type "${typeRef}"`)

    return contentType.hash
  }

  // instance interface
  return {
    forItem,
    list,
    refToVersionHash
  }
}

module.exports = {blueprint, New}
