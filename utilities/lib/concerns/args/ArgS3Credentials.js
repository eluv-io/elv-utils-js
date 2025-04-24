// code related to --s3Credentials arg
'use strict'
const {NewOpt} = require('../../options')

const Logger = require('../kits/Logger')
const ProcessJSON = require('../libs/ProcessJSON.js')

const {RemoteAccessListModel} = require('../../models/RemoteAccessListModels')

const blueprint = {
  name: 'ArgS3Credentials',
  concerns: [Logger],
  options: [
    NewOpt('s3Credentials', {
      descTemplate: 'Path to JSON file containing remote access info w/path matchers for files stored in cloud',
      group: 'Cloud',
      normalize: true,
      type: 'string'
    })
  ]
}

const New = context => {
  const asObject = () => context.args.credentials
    ? RemoteAccessListModel(ProcessJSON.parseFile({path: context.args.credentials}))
    : undefined

  return {
    asObject
  }
}

module.exports = {
  blueprint,
  New
}
