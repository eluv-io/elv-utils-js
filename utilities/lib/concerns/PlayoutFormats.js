// code related to offering playout formats
const R = require('@eluvio/ramda-fork')

const blueprint = {
  name: 'PlayoutFormats',
  concerns: []
}

const FORMAT_DEFS = {
  'dash-clear': {
    drm: null,
    protocol: {
      min_buffer_length: 2,
      type: 'ProtoDash'
    }
  },
  'dash-widevine': {
    drm: {
      content_id: '',
      enc_scheme_name: 'cenc',
      license_servers: [],
      type: 'DrmWidevine'
    },
    protocol: {
      min_buffer_length: 2,
      type: 'ProtoDash'
    }
  },
  'hls-aes128': {
    drm: {
      enc_scheme_name: 'aes-128',
      type: 'DrmAes128'
    },
    protocol: {
      type: 'ProtoHls'
    }
  },
  'hls-clear': {
    drm: null,
    protocol: {
      type: 'ProtoHls'
    }
  },
  'hls-fairplay': {
    drm: {
      enc_scheme_name: 'cbcs',
      license_servers: [],
      type: 'DrmFairplay'
    },
    protocol: {
      type: 'ProtoHls'
    }
  },
  'hls-playready-cenc': {
    'drm': {
      'enc_scheme_name': 'cenc',
      'type': 'DrmPlayReady'
    },
    'protocol': {
      'type': 'ProtoHls'
    }
  },
  'hls-sample-aes': {
    drm: {
      enc_scheme_name: 'cbcs',
      type: 'DrmSampleAes'
    },
    protocol: {
      type: 'ProtoHls'
    }
  },
  'hls-widevine-cenc': {
    drm: {
      content_id: '',
      enc_scheme_name: 'cenc',
      type: 'DrmWidevine'
    },
    protocol: {
      type: 'ProtoHls'
    }
  }
}

const FORMATS = Object.keys(FORMAT_DEFS)

const formatsIncludeDrm = formats => formats.find(f => FORMAT_DEFS[f].drm !== null) !== undefined

// return a copy of offering with playout_formats changed
const modifiedOffering = (offering, formats, elvCryptDrmKids) => {
  const result = R.clone(offering)
  // clear existing formats
  result.playout.playout_formats = {}
  for(const formatKey of formats){
    verifyCompatibility(result, formatKey, elvCryptDrmKids)
    result.playout.playout_formats[formatKey] = FORMAT_DEFS[formatKey]
  }
  return result
}

const verifyCompatibility = (offering, formatKey, elvCryptDrmKids = {}) => {
  const format = FORMAT_DEFS[formatKey]

  const elvCryptKeyIds = elvCryptDrmKids ? Object.keys(elvCryptDrmKids) : []
  const offeringPOKeyIds = offering.playout.drm_keys ? Object.keys(offering.playout.drm_keys) : []

  if(format.drm) {
    // DRM format
    if(offering.store_clear) throw Error('cannot add a DRM playout format to an offering that has "store_clear": true')

    // check that needed encryption schemes / keys are present in elvCrypt and in playout.drm_keys
    const encSchemeKey = format.drm.enc_scheme_name
    for(const [streamKey, stream] of Object.entries(offering.playout.streams)){
      const streamEncScheme = stream.encryption_schemes[encSchemeKey]
      if(!streamEncScheme) throw Error(`Stream '${streamKey}' does not have DRM key needed for format '${formatKey}'. Use the MezRegenDrmKeys.js script first.`)
      const drmKeyId = streamEncScheme.key_id
      if(!elvCryptKeyIds.includes(drmKeyId)) throw Error(`DRM key with id '${drmKeyId}' used by stream '${streamKey}' not found in /elv/crypt/drm/kids. Use the MezRegenDrmKeys.js script first to repair.`)
      if(!offeringPOKeyIds.includes(drmKeyId)) throw Error(`DRM key with id '${drmKeyId}' used by stream '${streamKey}' not found in offering playout/drm_keys. Use the MezRegenDrmKeys.js script first to repair.`)
    }
  } else {
    // clear format
    if(!offering.drm_optional) throw Error('cannot add a clear playout format to an offering that has "drm_optional": false')
  }

}


const New = () => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  FORMAT_DEFS,
  FORMATS,
  formatsIncludeDrm,
  New,
  modifiedOffering,
  verifyCompatibility
}
