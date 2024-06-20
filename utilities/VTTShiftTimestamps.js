const fs = require('fs')
// const path = require('path')

const isNumber = require('@eluvio/elv-js-helpers/Boolean/isNumber')

const {ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgFile = require('./lib/concerns/args/ArgFile')
const ArgOutfile = require('./lib/concerns/ArgOutfile')
const ArgTimeShift = require('./lib/concerns/ArgTimeShift')
const Subtitle = require('./lib/concerns/Subtitle')

class VTTShiftTimestamps extends Utility {
  static blueprint() {
    return {
      concerns: [
        Subtitle,
        ArgFile,
        ArgOutfile,
        ArgTimeShift
      ],
      options: [
        ModOpt('file', {
          demand: true,
          X: 'subtitle'
        }),
        ModOpt('timeShift', {
          X: 'from timestamps in subtitle file',
          demand: true
        }),
        ModOpt('outfile', {
          X: 'adjusted subtitles',
          demand: true
        })
      ]
    }
  }

  async body() {
    const logger = this.logger
    const {
      timeShift
    } = this.args

    const filePath = this.args.file

    // read captions file and apply any time shift
    let originalData = fs.readFileSync(filePath)
    const shiftedData = isNumber(timeShift) && (timeShift !== 0)
      ? Subtitle.adjustTimestamps(timeShift, originalData)
      : originalData

    logger.data('adjustedSubtitles', shiftedData)
    this.concerns.ArgOutfile.write({text: shiftedData})
  }

  header() {
    return 'Shift VTT timestamps.'
  }
}

if (require.main === module) {
  Utility.cmdLineInvoke(VTTShiftTimestamps)
} else {
  module.exports = VTTShiftTimestamps
}
