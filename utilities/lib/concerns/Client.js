const passesModelCheck = require('@eluvio/elv-js-helpers/Boolean/passesModelCheck')
const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const {ElvClient} = require('@eluvio/elv-client-js/src/ElvClient')

const elvRegions = require('../data/elv_regions')

const {NewOpt} = require('../options')

const Logger = require('./Logger')

const blueprint = {
  name: 'Client',
  concerns: [Logger],
  options: [
    NewOpt('configUrl', {
      conflicts: 'networkName',
      descTemplate: 'URL to query for Fabric configuration, enclosed in quotes - e.g. for Eluvio demo network: --configUrl "https://demov3.net955210.contentfabric.io/config" (you can choose to set env var FABRIC_CONFIG_URL instead)',
      group: 'API',
      type: 'string'
    }),
    NewOpt('networkName', {
      choices: ['local', 'main', 'demo', 'demov3', 'test'],
      conflicts: 'configUrl',
      descTemplate: 'Eluvio Content Fabric network (you can choose to set env var FABRIC_NETWORK instead)',
      group: 'API',
      type: 'string'
    }),
    NewOpt('debug', {
      descTemplate: 'Print debug logging for API calls',
      group: 'API',
      type: 'boolean'
    }),
    NewOpt('ethContractTimeout', {
      default: 20,
      descTemplate: 'Number of seconds to wait for ethereum contract calls',
      group: 'API',
      type: 'number'
    }),
    NewOpt('elvGeo', {
      choices: Object.keys(elvRegions).sort(),
      descTemplate: 'Geographic region for the fabric nodes.',
      group: 'API',
      type: 'string'
    })
  ]
}

const New = (context) => {
  // -------------------------------------
  // closures
  // -------------------------------------
  let configUrl = context.args.configUrl || context.env.FABRIC_CONFIG_URL
  const networkName = context.args.networkName || context.env.FABRIC_NETWORK

  // strip beginning/end quotes if included
  if (configUrl && /^".+"$/.test(configUrl)) {
    configUrl = configUrl.slice(1, -1)
  }

  const useNetworkName = !passesModelCheck(NonBlankStrModel,  configUrl)

  const {debug, ethContractTimeout} = context.args
  const region = context.args.elvGeo
  const logger = context.concerns.Logger
  const privateKey = context.env.PRIVATE_KEY
  let elvClient = null

  // -------------------------------------
  // interface: client
  // -------------------------------------

  // altConfigUrl :: string -> string | EXCEPTION
  // Converts a node URL (e.g. 'https://https://host-76-74-29-69.contentfabric.io') to a fabric config URL that
  // returns responses restricted to just that node (e.g.  'https://https://host-76-74-29-69.contentfabric.io/config?self&qspace=main')
  // Requires that ElvClient instance has already been initialized (to determine network name)
  const altConfigUrl = nodeUrl => {
    if (!elvClient) throw Error('cannot request alternate ElvClient without first initializing the main ElvClient instance')

    let url = new URL(nodeUrl)
    url.pathname = '/config'
    url.search = `?self&qspace=${elvClient.networkName}`
    return url.href
  }

  const get = async () => {
    // get client if we have not already
    if (!elvClient) {
      if (!privateKey) {
        throw Error('Please set environment variable PRIVATE_KEY')
      }

      if (!useNetworkName && !configUrl) {
        throw Error('Please supply either --configUrl or --networkName (or set an environment variable: either FABRIC_CONFIG_URL or FABRIC_NETWORK)')
      }

      logger.log(`Initializing elv-client-js... (${
        useNetworkName
          ? 'network name: ' + networkName
          : 'config URL: ' + configUrl
      })`)

      if (useNetworkName) {
        elvClient = await ElvClient.FromNetworkName({
          networkName,
          region,
          ethereumContractTimeout: ethContractTimeout
        })
      } else {
        elvClient = await ElvClient.FromConfigurationUrl({
          configUrl,
          region,
          ethereumContractTimeout: ethContractTimeout
        })
      }

      let wallet = elvClient.GenerateWallet()
      let signer = wallet.AddAccount({privateKey})
      await elvClient.SetSigner({signer})

      elvClient.ToggleLogging(
        debug,
        {
          log: logger.log,
          error: logger.error,
        }
      )
    }
    return elvClient
  }

  // instance interface
  return {
    altConfigUrl,
    get
  }
}

module.exports = {
  blueprint,
  New
}
