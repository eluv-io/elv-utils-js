// code related to working with Offering.Playout.Streams[x].Representations or ChannelOffering.Playout.Streams[x].Representations

const compare = require('@eluvio/elv-js-helpers/Functional/compare')
const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const blueprint = {
  name: 'Representations',
  concerns: []
}

const topRep = ({representations}) => {
  if (!representations) throwError('representations empty')
  return Object.entries(representations).sort((a,b) => compare(a.bit_rate,b.bit_rate))[0][1]
}

const New = () => {

  // instance interface


  return {}
}

module.exports = {
  blueprint,
  topRep,
  New
}
