// helpers to reduce boilerplate in tests

const fs = require('fs')
const path = require('path')

const chai = require('chai')
const sinon = require('sinon')

const mergeDeepRight = require('@eluvio/elv-js-helpers/Functional/mergeDeepRight')


// Utilities that do not use framework
const NONSTANDARD_UTILITIES = ['TextConvertForCmd.js', 'TextDecodeBase58.js']

const {dirListRecursive} = require('../utilities/lib/helpers')

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

const concernList = () => dirListRecursive(
  path.join(__dirname, '../utilities/lib/concerns')
).filter(
  f => path.extname(f) === '.js'
)


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

const params = testParams => mergeDeepRight(
  testParams,
  testEnv
)

const removeElvEnvVars = () => {
  delete process.env.ELVUTILS_CONF
  delete process.env.FABRIC_CONFIG_URL
  delete process.env.PRIVATE_KEY
}

const requireConcern = subDirAndFilename => path.isAbsolute(subDirAndFilename)
  ? require(subDirAndFilename)
  : require(path.join(__dirname, '../utilities/lib/concerns', subDirAndFilename))

const requireUtility = subDirAndFilename => require(path.join(__dirname, '../utilities', subDirAndFilename))

const utilityFileList = () => fs.readdirSync(path.join(__dirname, '../utilities')).filter(f => path.extname(f) === '.js' && !NONSTANDARD_UTILITIES.includes(f))

module.exports = {
  argList2Params,
  chai,
  concernList,
  concern2utility,
  expect,
  params,
  removeElvEnvVars,
  requireConcern,
  requireUtility,
  sinon,
  testEnv,
  utilityFileList
}
