// code related to working with auth tokens

const Client = require('../kits/Client')
const Logger = require('../kits/Logger')

const blueprint = {
  name: 'AuthToken',
  concerns: [Logger, Client]
}

const New = context => {
  const getPlain = async () => {
    const client = await context.concerns.Client.get()
    return await client.authClient.AuthorizationToken({
      noAuth: true  // Don't create an accessRequest blockchain transaction
    })
  }

  // instance interface
  return {
    getPlain
  }
}

module.exports = {
  blueprint,
  New
}
