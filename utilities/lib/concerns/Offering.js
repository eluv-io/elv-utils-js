// code related to working with offerings

const Logger = require('./Logger')

const blueprint = {
  name: 'Offering',
  concerns: [Logger]
}

const firstVideoStreamKey = ({offering}) => {
  for(const [streamKey, stream] of Object.entries(offering.media_struct.streams)) {
    if(stream.codec_type === 'video') return streamKey
  }
  throw new Error('No video stream found in offering')
}

const New = () => {

  // instance interface
  return {

  }
}

module.exports = {
  blueprint,
  firstVideoStreamKey,
  New
}
