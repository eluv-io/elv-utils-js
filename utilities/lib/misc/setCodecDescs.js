const R = require('@eluvio/ramda-fork')

const {codecDesc} = require('./mp4InitSeg')

const setCodecDescs = async ({
  elvClient,
  libraryId,
  logger,
  objectId,
  offeringKey,
  offeringMetadata,
  writeToken
}) => {

  const result = R.clone(offeringMetadata)

  // get first available playout format (for constructing init segment urls)
  const formats = result.playout.playout_formats
  const formatKeys = Object.keys(formats)
  if(formatKeys.length > 0) {
    const firstFormatKey = formatKeys[0]
    const player_profile = formats[firstFormatKey].drm && formats[firstFormatKey].drm.type === 'DrmAes128' ?
      'hls-js' :
      ''

    // find video streams, request init segments, set codec_desc
    for(const [streamKey, poStream] of Object.entries(result.playout.streams)) {
      // look up media type by cross-referencing to media struct
      const msStream = result.media_struct.streams[streamKey]
      if(!msStream) throw Error(`Stream '${streamKey}' from offering.playout.streams not found in offering.media_struct.streams`)
      if(msStream.codec_type === 'video') {

        const authToken = await elvClient.authClient.AuthorizationToken({
          libraryId,
          objectId,
          writeToken,
          update: false
        })

        // get bitrate ladder
        const reps = poStream.representations
        for(const [repKey, rep] of R.sortBy(x => -x[1].bit_rate, Object.entries(reps))) {
          const initSegUrl = `playout/${offeringKey}/${firstFormatKey}/${streamKey}/${repKey}/init.m4s`
          logger && logger.log(`  Retrieving ${initSegUrl}...`)
          const url = new URL(
            await elvClient.FabricUrl({
              libraryId,
              objectId,
              rep: initSegUrl,
              writeToken
            })
          )

          const path = url.pathname
          let queryParams = {
            authorization: authToken
          }
          if(player_profile) queryParams.player_profile = player_profile

          // console.log('===============================')
          // let curlURL = new URL(elvClient.HttpClient.BaseURI().href())
          // curlURL.pathname = path
          // curlURL.searchParams.append('authorization', authToken)
          // console.log(`curl "${curlURL.href}"`)
          // console.log('===============================')

          // get init segment
          const response = await elvClient.HttpClient.Request({
            path,
            queryParams,
            method: 'GET'
          })
          const buffer = Buffer.from(await response.arrayBuffer())

          // make codec desc based on init seg
          rep.codec_desc = codecDesc(buffer)
          logger && logger.log(`    codec desc: ${rep.codec_desc}`)
        }
      }
    }
  }

  return result
}

module.exports = setCodecDescs
