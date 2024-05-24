// helpers to reduce boilerplate in tests

const path = require('path')

const chai = require('chai')
const sinon = require('sinon')

const mergeDeepRight = require('@eluvio/elv-js-helpers/Functional/mergeDeepRight')
const now = require('@eluvio/elv-js-helpers/Datetime/now')

const {concernList, concernsDir, exampleFilesDir, runUtility, utilitiesDir} = require('../utilities/lib/helpers')

const Utility = require('../utilities/lib/Utility')

chai.should()
const expect = chai.expect


const testEnv = {
  cwd: __dirname,
  env: {ELVUTILS_THROW: 1, ELVUTILS_SUPPRESS_USAGE: 1}
}

const argList2Params = (...argList) => {
  argList = argList || []
  argList = argList.concat('--silent')
  return {
    argList,
    ...testEnv
  }
}

const concern2utility = concernObject => {

  class TestUtility extends Utility {
    static blueprint() {
      return {
        concerns: [concernObject]
      }
    }

    async body() {

    }

    header() {
      return `TestUtility loading concern ${concernObject.blueprint().name}...`
    }
  }

  return TestUtility
}

const exampleABRProfilePath = (filename) => path.join(exampleFilesDir, filename)

const exampleVideoPath = path.join(exampleFilesDir, 'video.mp4')

const params = testParams => mergeDeepRight(
  testParams,
  testEnv
)

// adds timestamp prefix to string
const prefixTimestamp = (str) => `${now().toISOString()} ${str}`

const removeElvEnvVars = () => {
  delete process.env.ELVUTILS_CONF
  delete process.env.FABRIC_CONFIG_URL
  delete process.env.PRIVATE_KEY
}

const requireConcern = subDirAndFilename => path.isAbsolute(subDirAndFilename)
  ? require(subDirAndFilename)
  : require(path.join(concernsDir, subDirAndFilename))

const requireUtility = subDirAndFilename => require(path.join(utilitiesDir, subDirAndFilename))

// awaitTest run the utility synchronously and throw error if it fails
const runUtilityTest =  (utility, argList, env, throwOnError = true) => {
  if (!process.env.ELVUTILS_CONFIG) throw Error('Env variable ELVUTILS_CONFIG must be set to run integration test')

  runUtility(utility, argList, testEnv, throwOnError).then(
    successValue => {
      console.log('Test passed.')
      return successValue
    },
    failureReason => {
      throw Error(failureReason)
    }
  )
}

// pass in __filename (which is a full path), get back string with current timestamp + just file name
const timestampFilename = (filePath) => prefixTimestamp(path.basename(filePath))

const utilityPath = (utilFilename) => path.join(utilitiesDir, utilFilename)

module.exports = {
  argList2Params,
  chai,
  concernList,
  concernsDir,
  concern2utility,
  exampleABRProfilePath,
  exampleVideoPath,
  expect,
  params,
  prefixTimestamp,
  removeElvEnvVars,
  requireConcern,
  requireUtility,
  runUtilityTest,
  sinon,
  testEnv,
  timestampFilename,
  utilitiesDir,
  utilityPath
}
