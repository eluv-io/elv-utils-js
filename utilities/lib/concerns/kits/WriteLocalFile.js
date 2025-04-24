// code related to writing results to a local file
const fs = require('fs')

const columnify = require('columnify')
const R = require('@eluvio/ramda-fork')

const {absPath, identity} = require('../../helpers.js')

const {ModOpt} = require('../../options')

const Logger = require('./Logger')
const ArgOutfile = require('../args/ArgOutfile')
const ArgOverwrite = require('../args/ArgOverwrite')

const blueprint = {
  name: 'WriteLocalFile',
  concerns: [Logger, ArgOutfile, ArgOverwrite],
  options: [
    ModOpt('overwrite', {
      X: 'file'
    })
  ]
}

const New = context => {
  const logger = context.concerns.Logger

  const write = ({text}) => {
    const {outfile} = context.args
    if(!outfile) throw Error('ArgOutfile.write() - missing --outfile')
    const fullPath = absPath(outfile, context.cwd)
    if(fs.existsSync(fullPath)) {
      if(context.args.overwrite) {
        logger.warn(`File '${fullPath}' already exists, --overwrite specified, replacing...`)
      } else {
        throw Error(`File '${fullPath}' already exists.`)
      }
    }
    logger.log(`Writing data to ${fullPath}...`)
    return fs.writeFileSync(fullPath, text)
  }

  const writeJson = ({obj}) => write({text: JSON.stringify(obj, null, 2)})

  const writeTable = ({list, options = {}}) => {
    const mergedOptions = R.mergeDeepRight(
      {headingTransform: identity},
      options
    )
    write({text: columnify(list, mergedOptions)})
  }



  // instance interface
  return {
    write,
    writeJson,
    writeTable
  }
}

module.exports = {
  blueprint,
  New
}
