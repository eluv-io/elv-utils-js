// Code for working with channel (composition) offering Playout Stream Representations (ladder rungs)
'use strict'
const pick = require('@eluvio/elv-js-helpers/Functional/pick')

const blueprint = {
  name: 'ChOffPoStrRep',
  concerns: []
}

// upgrade : Object -> Object
// Take an object in old format and upgrade
// (removes deprecated / unused fields)
const upgrade = old => pick(
  [
    'bit_rate',
    'channels', // new field
    'codec',
    'codec_desc',
    'height',
    'type',
    'width'
  ],
  old
)


const New = () => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  upgrade,
  New
}
