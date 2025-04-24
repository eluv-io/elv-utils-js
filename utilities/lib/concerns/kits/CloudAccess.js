const {CheckedRemoteAccessList, RemoteAccessListModel} = require('../../models/RemoteAccessListModels')

const ArgS3Credentials = require('../args/ArgS3Credentials')

const blueprint = {
  name: 'CloudAccess',
  concerns: [ArgS3Credentials]
}

const New = context => {
  const remoteAccessList = (throwOnValidationErr = true) => {

    const retVal = context.concerns.ArgS3Credentials.asObject() || [
      {
        path_matchers: ['.*'],
        remote_access: {
          protocol: 's3',
          platform: 'aws',
          path: context.env.AWS_BUCKET,
          storage_endpoint: {
            region: context.env.AWS_REGION
          },
          cloud_credentials: {
            access_key_id: context.env.AWS_KEY,
            secret_access_key: context.env.AWS_SECRET
          }
        }
      }
    ]

    // validate
    return CheckedRemoteAccessList(retVal).either(
      () => throwOnValidationErr ? RemoteAccessListModel(retVal) : null, // error case, force a validation error or return null
      () => retVal // ok case, return validated remote access list
    )
  }

  return {
    remoteAccessList
  }
}

module.exports = {
  blueprint,
  New
}
