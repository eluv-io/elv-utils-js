// Holds sets of credentials for S3, along with path matching rules

const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const awsRegions = require('../data/aws_regions')
const awsRegionNames = Object.keys(awsRegions)

const {
  CheckedResult,
  ObjectModel,
  SealedModel,
  TypedArrayNonEmpty
} = require('./Models')

const StorageEndpointModel = SealedModel({
  region: awsRegionNames
})

const CloudCredentialsModel = SealedModel({
  access_key_id: NonBlankStrModel,
  secret_access_key: NonBlankStrModel
})

const RemoteAccessModel = ObjectModel({
  protocol: 's3',
  platform: 'aws',
  path: NonBlankStrModel,
  storage_endpoint: StorageEndpointModel,
  cloud_credentials: CloudCredentialsModel
})

const CredentialModel = ObjectModel({
  path_matchers: TypedArrayNonEmpty(NonBlankStrModel),
  remote_access: RemoteAccessModel
})

const CredentialSetModel = TypedArrayNonEmpty(CredentialModel)

const CheckedCredential = CheckedResult(CredentialModel)
const CheckedCredentialSet = CheckedResult(CredentialSetModel)

module.exports = {
  CheckedCredential,
  CheckedCredentialSet,
  CredentialModel,
  CredentialSetModel,
}
