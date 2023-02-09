const Airtable = require('airtable')

const Logger = require('./Logger')

const blueprint = {
  name: 'Airtable',
  concerns: [Logger]
}

const records =  async ({apiKey, baseId, tableName, options}) => {
  const result = []
  const base = new Airtable({apiKey}).base(baseId)
  const query = base(tableName).select(options)
  await query.eachPage(
    (records, next) => {
      records.forEach(r => result.push(r))
      next()
    }
  )
  return result
}

// retrieve 'Tenancy' table as an object keyed by the Setting name
const tenancy = async ({apiKey, baseId}) => {
  const recs = await records({
    apiKey,
    baseId,
    tableName: 'Tenancy'
  })
  return Object.fromEntries(recs.map(r => [r.fields.Setting, r.fields.Value]))
}

const New = () => {
  // const logger = context.concerns.Logger

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  New,
  records,
  tenancy
}

