// Holds sets of remote access credentials for S3, along with path matching rules
'use strict'

const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const defNonEmptyArrModel = require('@eluvio/elv-js-helpers/ModelFactory/defNonEmptyArrModel')
const defSealedObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defSealedObjModel')

const validateWithModel = require('@eluvio/elv-js-helpers/Validation/validateWithModel')

const awsRegions = require('../data/aws_regions')
const awsRegionNames = Object.keys(awsRegions)

const StorageEndpointStandardModel = defSealedObjModel(
  'StorageEndpointStandard',
  {
    region: awsRegionNames // AWS_REGION - value is still required for signed URLs although it is ignored by fabric
  }
)

const StorageEndpointSignedUrlModel = defSealedObjModel(
  'StorageEndpointSignedUrl',
  {
    region: undefined
  }
)

const CloudCredentialsStandardModel = defSealedObjModel(
  'CloudCredentialsStandard',
  {
    access_key_id: NonBlankStrModel,
    secret_access_key: NonBlankStrModel
  }
)

const CloudCredentialsSignedUrlModel = defSealedObjModel(
  'CloudCredentialsSignedUrl',
  {
    access_key_id: undefined,
    secret_access_key: undefined
  }
)

const RemoteAccessStandardModel = defSealedObjModel(
  'RemoteAccessStandard',
  {
    protocol: 's3',
    platform: 'aws',
    path: NonBlankStrModel, // AWS_BUCKET or signed URL path without 'http(s)//hostname'
    storage_endpoint: StorageEndpointStandardModel, // contains AWS_REGION
    cloud_credentials: CloudCredentialsStandardModel
  }
)

const RemoteAccessSignedUrlModel = defSealedObjModel(
  'RemoteAccessSignedUrl',
  {
    protocol: 's3',
    platform: 'aws',
    path: undefined,
    storage_endpoint: StorageEndpointSignedUrlModel,
    cloud_credentials: CloudCredentialsSignedUrlModel
  }
)

const PathsRemoteAccessModel = defSealedObjModel(
  'PathsRemoteAccess',
  {
    path_matchers: defNonEmptyArrModel(
      'PathMatchers',
      NonBlankStrModel
    ),
    remote_access: [RemoteAccessStandardModel, RemoteAccessSignedUrlModel]
  }
)

const RemoteAccessListModel = defNonEmptyArrModel(
  'RemoteAccessList',
  PathsRemoteAccessModel
)

const CheckedPathsRemoteAccess = validateWithModel(PathsRemoteAccessModel)
const CheckedRemoteAccessList = validateWithModel(RemoteAccessListModel)

module.exports = {
  CheckedPathsRemoteAccess,
  CheckedRemoteAccessList,
  PathsRemoteAccessModel,
  RemoteAccessListModel,
}
