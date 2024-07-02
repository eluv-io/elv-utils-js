const NonBlankStrModel = require('@eluvio/elv-js-helpers/Model/NonBlankStrModel')

const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgCommitMsg',
  options: [
    NewOpt('commitMsg', {
      descTemplate: 'Commit message for finalization',
      coerce: NonBlankStrModel,
      type: 'string',
      conflicts: 'noFinalize'
    })
  ]
}

const New = () => {
  // instance interface
  return {}
}

module.exports = {
  blueprint,
  New
}
