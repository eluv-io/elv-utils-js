// Code for working with channel (composition) offering Playout Streams
'use strict'

const clone = require('@eluvio/elv-js-helpers/Functional/clone')
const mapObjValues = require('@eluvio/elv-js-helpers/Functional/mapObjValues')

const ChOffPoStrRep = require('./ChOffPoStrRep')

const blueprint = {
  name: 'ChOffPlayout',
  concerns: []
}

// upgrade : Object -> Object
// Take an object in old format and upgrade
const upgrade = old => {
  return Object(
    {
      encryption_schemes: clone(old.encryption_schemes),
      representations: mapObjValues(
        ChOffPoStrRep.upgrade,
        old.representations
      )
    }
  )
}

const New = () => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  upgrade,
  New
}
