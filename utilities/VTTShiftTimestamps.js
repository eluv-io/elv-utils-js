// Create a new subtitle VTT file based on an existing VTT file, but shift timestamps by specified amount
'use strict'
const isNumber = require('@eluvio/elv-js-helpers/Boolean/isNumber')

const {ModOpt} = require('./lib/options')
const Utility = require('./lib/Utility')

const ArgFile = require('./lib/concerns/args/ArgFile')
const ArgTimeShift = require('./lib/concerns/args/ArgTimeShift')
const Logger = require('./lib/concerns/kits/Logger')
const Subtitle = require('./lib/concerns/libs/Subtitle')
const WriteLocalFile = require('./lib/concerns/kits/WriteLocalFile')

class VTTShiftTimestamps extends Utility {
  static blueprint() {
    return {
      concerns: [Logger, Subtitle, WriteLocalFile, ArgFile, ArgTimeShift],
      options: [
        ModOpt('file', {
          demand: true,
          X: 'VTT subtitle file'
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
    const {timeShift} = this.args

    // read captions file and apply any time shift
    const originalData = this.concerns.ArgFile.read()
    const shiftedData = isNumber(timeShift) && (timeShift !== 0)
      ? Subtitle.adjustTimestamps(timeShift, originalData)
      : originalData

    logger.data('adjusted_subtitles', shiftedData)

    // Write new file
    this.concerns.WriteLocalFile.write({text: shiftedData})
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
