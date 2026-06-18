// Code for working with channel (composition) offering Playout
'use strict'

const clone = require('@eluvio/elv-js-helpers/Functional/clone')
const mapObjValues = require('@eluvio/elv-js-helpers/Functional/mapObjValues')

const ChOffPoStream = require('./ChOffPoStream')

const blueprint = {
  name: 'ChOffPlayout',
  concerns: []
}

// upgrade : Object -> Object
// Take an object in old format and upgrade
const upgrade = old => Object(
  {
    drm_keys: clone(old.drm_keys),
    playout_formats: clone(old.playout_formats),
    streams: mapObjValues(
      ChOffPoStream.upgrade,
      old.streams
    )
  }
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
