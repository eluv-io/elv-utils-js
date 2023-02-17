// helper to reduce boilerplate in tests
const path = require('path')

const chai = require('chai')
const sinon = require('sinon')
const mergeDeepRight = require('@eluvio/elv-js-helpers/Functional/mergeDeepRight')

const Utility = require('../lib/Utility')

chai.should()
const expect = chai.expect


const testEnv = {
  cwd: __dirname,
  env: {ELVUTILS_THROW: 1, ELVUTILS_SUPPRESS_USAGE: 1}
}

const argList2Params = (...argList) => {
  argList = argList || []
  argList = argList.concat('--silent')
  argList = argList.concat('-v')
  return {
    argList,
    ...testEnv
  }
}

const concern2utility = (concernObject, argList) => {

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

  return new TestUtility(argList2Params(...argList))
}

const params = testParams => mergeDeepRight(
  testParams,
  testEnv
)

const removeElvEnvVars = () => {
  delete process.env.ELVUTILS_CONF
  delete process.env.FABRIC_CONFIG_URL
  delete process.env.PRIVATE_KEY
}

const requireConcern = subDirAndFilename => require(path.join(__dirname, '../lib/concerns', subDirAndFilename))

const requireUtility = subDirAndFilename => require(path.join(__dirname, '../', subDirAndFilename))

module.exports = {
  argList2Params,
  chai,
  concern2utility,
  expect,
  params,
  removeElvEnvVars,
  requireConcern,
  requireUtility,
  sinon,
  testEnv
}
