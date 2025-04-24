// code related to --ignoreBitrateLimit arg
'use strict'
const {NewOpt} = require('../../options')

const blueprint = {
  name: 'ArgIgnoreBitrateLimit',
  options: [
    NewOpt('ignoreBitrateLimit', {
      descTemplate: 'When finalizing Mezzanine Offering, proceed even if final average bitrate greatly exceeds target',
      type: 'boolean',
      implies: 'finalize'
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
