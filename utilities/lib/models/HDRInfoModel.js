'use strict'
const defRegexMatchedStrModel = require('@eluvio/elv-js-helpers/ModelFactory/defRegexMatchedStrModel')
const defSealedObjModel = require('@eluvio/elv-js-helpers/ModelFactory/defSealedObjModel')

const HDRInfoModel = defSealedObjModel(
  'HDRInfo',
  {
    master_display: defRegexMatchedStrModel('MasterDisplay', /^G([0-9]+,[0-9]+)B([0-9]+,[0-9]+)R([0-9]+,[0-9]+)WP([0-9]+,[0-9]+)L([0-9]+,[0-9]+)$/),
    max_cll: defRegexMatchedStrModel('MaxCLL/FALL', /^[0-9]+,[0-9]+$/)
  }
)

module.exports = HDRInfoModel
