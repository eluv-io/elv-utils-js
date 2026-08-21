// code related to working with Offering.Playout.Streams[x] or ChannelOffering.Playout.Streams[x]

const throwError = require('@eluvio/elv-js-helpers/Misc/throwError')

const blueprint = {
  name: 'PlayoutStream',
  concerns: []
}

const safeRepresentations = ({poStream}) => poStream.representations || throwError('playout stream has no representations')

const New = () => {

  // instance interface


  return {}
}

module.exports = {
  blueprint,
  safeRepresentations,
  New
}
