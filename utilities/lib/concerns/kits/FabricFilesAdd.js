// groups arguments related to adding files to an object
'use strict'
const {ModOpt} = require('../../options')

const ArgDestDir = require('../args/ArgDestDir')
const ArgFiles = require('../args/ArgFiles')
const ArgStoreClear = require('../args/ArgStoreClear')
const Logger = require('./Logger')

const blueprint = {
  name: 'FabricFilesAdd',
  concerns: [ArgDestDir, ArgFiles, ArgStoreClear, Logger],
  options: [
    ModOpt(
      'destDir', {
        descTemplate: 'Destination directory within object (must start with \'/\'). Will be created if it does not exist.',
      }),
    ModOpt('files', {
      demand: true,
      X: 'to add to object'
    }),
    ModOpt('storeClear', {
      descTemplate: 'If specified, files will not be encrypted in storage'
    })
  ]
}

const New = () => {
  return {}
}

module.exports = {blueprint, New}
