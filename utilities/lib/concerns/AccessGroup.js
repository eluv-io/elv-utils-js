// code related to Access Groups
'use strict'
const sortBy = require('@eluvio/elv-js-helpers/Functional/sortBy')

const Client = require('./Client')
const Logger = require('./kits/Logger.js')

const blueprint = {
  name: 'AccessGroup',
  concerns: [Logger, Client]
}

const New = context => {

  // returns an object keyed by group address
  const index = async () => {
    const client = await context.concerns.Client.get()
    const response = await client.ListAccessGroups()
    return Object.fromEntries(response.map(g => [g.address, {name: g.meta?.public?.name}]))
  }

  // returns an array
  const list = async () => {
    const client = await context.concerns.Client.get()
    const response = await client.ListAccessGroups()
    const nameSort = sortBy(x => x.name?.toLowerCase())
    return nameSort(response.map(g=> new Object({address: g.address, name: g.meta?.public?.name})))
  }

  // instance interface
  return {
    index,
    list
  }
}

module.exports = {
  blueprint,
  New
}
