'use strict'
const compare = require('@eluvio/elv-js-helpers/Functional/compare.js')
const throwError = require('@eluvio/elv-js-helpers/Misc/throwError.js')

const Logger = require('../kits/Logger.js')

const blueprint = {
  name: 'OfferingPlayoutStream',
  concerns: [Logger]
}

// returns array [[rep1Key, rep1], [rep2Key, rep2]...] with highest bitrates first
const sortedRepList = ({playoutStream}) => {
  const reps = playoutStream.representations
  if (!reps || reps.length === 0) throwError('Playout stream has no representations')
  return Object.entries(playoutStream.representations).sort((a,b) => compare(b[1].bit_rate, a[1].bit_rate))
}

const topRep = ({playoutStream}) => sortedRepList({playoutStream})[0][1]

const topRepKey = ({playoutStream}) => sortedRepList({playoutStream})[0][0]

const New = () => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  New,
  sortedRepList,
  topRep,
  topRepKey
}
