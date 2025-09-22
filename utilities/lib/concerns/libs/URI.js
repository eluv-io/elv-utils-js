// code related to working with URIs
'use strict'
const urijs = require('urijs')

const Logger = require('../kits/Logger')

const blueprint = {
  name: 'URI',
  concerns: [Logger]
}

// isHttpUrl : URI -> boolean
// Returns true if uri looks like a well-formed http or https url
const isHttpUrl = uri => uri.is('url') &&
  uri.is('absolute') &&
  ['http', 'https'].includes(uri.protocol())

// normalizedURI : string -> URI
// creates a normalized URI from string
const normalizedURI = str => urijs(str)
  .normalizeProtocol()
  .normalizeHostname()
  .normalizePath()
  .normalizeQuery()
  .normalizeHash()

const New = () => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  isHttpUrl,
  New,
  normalizedURI
}
