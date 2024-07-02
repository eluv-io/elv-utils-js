const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgNoFinalize',
  options: [
    NewOpt('noFinalize', {
      descTemplate: 'Leave draft unfinalized after making changes',
      type: 'boolean',
      conflicts: ['finalize', 'writeToken'] // most utilities when using --writeToken already are by default not supposed to finalize
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
