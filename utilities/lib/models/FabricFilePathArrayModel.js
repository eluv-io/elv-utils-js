'use strict'
const defArrayModel = require('@eluvio/elv-js-helpers/ModelFactory/defArrayModel')

const FabricFilePathModel = require('./FabricFilePathModel')

const FabricFilePathArrayModel = defArrayModel('FabricFilePathArray', FabricFilePathModel)

module.exports = FabricFilePathArrayModel
