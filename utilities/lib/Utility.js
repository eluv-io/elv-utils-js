// base class for utility scripts

// ==================================
// Check node.js version
let nodeMajorVersion
try {
  nodeMajorVersion = parseInt(process.version.match(/^v(\d+)\.\d+/)[1])
} catch (e) {
  throw Error(`Error while checking version of Node.js: ${e}`)
}
if (nodeMajorVersion < 14) throw Error(`Node.js version at least 14 required (found: ${process.version})`)
// ==================================

// ==================================
// Suppress Node.js warning about experimental fetch API
// Ref: https://github.com/nodejs/node/issues/30810#issuecomment-1383184769
const originalEmit = process.emit
process.emit = function (event, error) {
  if (
    event === 'warning' &&
    error.name === 'ExperimentalWarning' &&
    error.message.includes('The Fetch API is an experimental feature.')
  ) {
    return false
  }

  return originalEmit.apply(process, arguments)
}
// ==================================

const yargs = require('yargs/yargs')
const yargsTerminalWidth = require('yargs').terminalWidth

const clone = require('@eluvio/elv-js-helpers/Functional/clone')
const flatten = require('@eluvio/elv-js-helpers/Functional/flatten')
const isArray = require('@eluvio/elv-js-helpers/Boolean/isArray')


const {loadConcerns} = require('./concerns')
const {callContext, cmdLineContext} = require('./context')
const {BuildWidget, ModOpt, NewOpt} = require('./options')

const ArgPresets = require('./concerns/args/ArgPresets')
const ArgConfs = require('./concerns/args/ArgConfs')
const Configs = require('./configs')

const Logger = require('./concerns/Logger')

const addUniversalItems = (blueprint) => {
  return {
    checksMap: blueprint.checksMap ? clone(blueprint.checksMap) : undefined,
    concerns: flatten([ArgConfs, ArgPresets, Logger, clone(blueprint.concerns) || []]),
    name: 'Utility',
    options: blueprint.options
      ? clone(blueprint.options)
      : []
  }
}

const checkFunctionFactory = checksMap => {
  return (argv, options) => {
    for(const key in checksMap) {
      if(!checksMap[key](argv, options)) {
        return false
      }
    }
    return true
  }
}

const getPrelimParseArgs = (argsList, yargsOptMap) => {
  const optMap = clone(yargsOptMap)
  // console.log(JSON.stringify(optMap,null,2));
  for(const k of Object.keys(optMap)){
    delete optMap[k].default
  }

  let prelimYargsParser = yargs()
    .option(optMap)
    .help(false)
    .version(false)
    // prevents exit from program for --help or parse failure
    .exitProcess(false)
    .fail(() => { // unused input args: msg, err, yargs
      // nothing
    })

  return prelimYargsParser.parse(argsList)
}

module.exports = class Utility {
  static async cmdLineInvoke(klass) {
    let utility
    try {
      utility = new klass('cmdLineInvoke')
    } catch(e) {
      // eslint-disable-next-line no-console
      console.error(`\n${e.message}\n`)
      if(process.env.ELVUTILS_THROW) throw e
      process.exit(1)
    }
    await utility.run()
    if(!process.exitCode) {
      process.exit(0)
    } else {
      process.exit()
    }
  }

  static argMap() {
    return this.buildWidget(this.blueprintFinal()).data().yargsOptMap
  }

  static blueprint() {
    throw Error('call to abstract base class method blueprint()')
  }

  // returns blueprint with universal concerns / properties added in
  static blueprintFinal() {
    return addUniversalItems(this.blueprint())
  }

  static buildWidget(blueprint) {
    return BuildWidget(blueprint)
  }

  static ModOpt(optName, overrides) {
    return ModOpt(optName, overrides)
  }

  static NewOpt(optName, newOptDef) {
    return NewOpt(optName, newOptDef)
  }

  constructor(params) {
    const blueprintFinal = this.constructor.blueprintFinal()
    this.widget = this.constructor.buildWidget(blueprintFinal)

    this.context = params === 'cmdLineInvoke'
      ? cmdLineContext() // invoked at command line
      : callContext(params) // module call

    // process --confs if present (and ELVUTILS_CONFIG env var)
    const prelimParsedArgs = getPrelimParseArgs(this.context.argList, this.widget.data().yargsOptMap)
    const {conf, presets} = prelimParsedArgs
    if(this.context.env.ELVUTILS_CONFIG || (isArray(conf) && conf.length > 0)) {
      if (this.context.mode === 'cmd') console.warn()
      let confFilePaths = []
      if(this.context.env.ELVUTILS_CONFIG) {
        if (this.context.mode === 'cmd') console.warn(`ELVUTILS_CONFIG env var found, loading config from: ${this.context.env.ELVUTILS_CONFIG}`)
        confFilePaths.push(this.context.env.ELVUTILS_CONFIG)
      }
      if(isArray(conf) && conf.length > 0) {
        if (this.context.mode === 'cmd') console.warn(`--confs option specified, loading config(s) from: ${conf.join(', ')}`)
        confFilePaths = confFilePaths.concat(conf)
      }
      if (this.context.mode === 'cmd') console.warn()
      const mergedContext = Configs.contextMerge(
        {
          confFilePaths,
          cwd: this.context.cwd,
          env: this.context.env,
          prelimParsedArgs,
          presetNames: presets,
          suppliedArgList: this.context.argList,
          utilityArgsMap: this.constructor.argMap()
        }
      )
      this.context.env = mergedContext.mergedEnv
      this.context.argList = mergedContext.mergedArgList
    }

    let yargsParser = yargs()
      .option('debugArgs', {hidden: true, type: 'boolean'})
      .option('help', {
        desc: 'Show help for command line options',
        group: 'General',
        type: 'boolean'
      })
      .options(this.widget.data().yargsOptMap)
      .check(checkFunctionFactory(this.widget.data().checksMap))
      .strict()
      .version(false)
      .usage('')
      .wrap(yargsTerminalWidth())
      .fail((msg, err, yargs) => {
        if(err) throw err // preserve stack
        // eslint-disable-next-line no-console
        if(!this.context.env.ELVUTILS_SUPPRESS_USAGE) console.error(yargs.help())
        throw Error(msg)
      })

    this.context.args = yargsParser.parse(this.context.argList)

    if(this.context.args.debugArgs) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(this.context.args, null, 2))
      process.exit(0)
    }

    loadConcerns(this.context, blueprintFinal.concerns)

    // convenience shortcuts
    this.concerns = this.context.concerns
    this.args = this.context.args
    this.argList = this.context.argList
    this.env = this.context.env
    this.logger = this.concerns.Logger
    this.logger.args(this.args)
  }

  blueprint() {
    return this.constructor.blueprint()
  }

  // actual work specific to individual script
  async body() {
    throw Error('call to abstract base class method body()')
  }

  // default footer
  footer() {
    return 'Done.'
  }

  header() {
    throw Error('call to abstract base class method header()')
  }

  async run() {
    this.logger.logList(
      '',
      this.header(),
      ''
    )
    return this.body().then(successValue => {
      this.logger.logList(
        '',
        this.footer(),
        ''
      )
      this.logger.exitCode(0)
      this.logger.successValue(successValue)
      this.logger.outputJSON()
      return this.logger.allInfoGet()
    }, failureReason => {
      this.logger.error(failureReason)
      if(failureReason?.message) this.logger.error(failureReason?.message)
      if(failureReason?.url) this.logger.error(failureReason?.url)
      if(isArray(failureReason?.body?.errors)) this.logger.error(failureReason?.body?.errors.map(e => e.reason || `${e}`))

      this.logger.log()
      if(this.env.ELVUTILS_THROW) throw Error(failureReason)
      if(!process.exitCode) process.exitCode = 1
      this.logger.exitCode(process.exitCode)
      this.logger.failureReason(failureReason)
      this.logger.outputJSON()
      this.logger.error('FAILED!')
      this.logger.log('')
      return this.logger.allInfoGet()
    })
  }
}
