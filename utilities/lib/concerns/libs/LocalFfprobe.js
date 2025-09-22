const child_process = require('child_process')

const throwError = require('@eluvio/elv-js-helpers/Misc/throwError.js')

const Logger = require('../kits/Logger')

const blueprint = {
  name: 'LocalFfprobe',
  concerns: [Logger]
}

const New = context => {
  const logger = context.concerns.Logger

  const probe = filepath => {
    version()

    const procResult = child_process.spawnSync(
      'ffprobe',
      [
        '-hide_banner',
        '-v', 'error',
        '-print_format', 'json',
        '-show_streams',
        '-i', filepath
      ]
    )
    if (procResult.status !== 0) {
      logger.error(procResult.stderr.toString())
      throwError('ffprobe returned error')
    }
    return procResult.stdout.toString()
  }

  const version = () => {
    logger.log('Checking ffprobe version...')
    const procResult = child_process.spawnSync(
      'ffprobe',
      ['-version']
    )

    if (procResult.status !== 0) {
      logger.error(procResult.stderr.toString())
      throwError('Could not determine ffprobe version, check that it exists and is in your PATH')
    }
    const versionRE = /ffprobe version (\S+) Copyright/

    const match = procResult.stdout.toString().match(versionRE)

    if (!match || !match[1]) {
      logger.error('ffprobe -version output:')
      logger.error(procResult.stdout.toString())
      throwError('Could not find ffprobe version in output, check that it exists and is in your PATH')
    }
    logger.log(`Found version: ${match[1]}`)

    return match[1]
  }


  // instance interface
  return {
    probe,
    version
  }
}

module.exports = {
  blueprint,
  New
}
