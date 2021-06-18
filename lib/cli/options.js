const yargs = require('yargs')

const convertOptions = (args, attrs) => {
  const attributes = attrs || []
  const safeMode = 'unsafe'
  const baseDir = args['base-dir']
  const verbose = args.verbose
  const requireLib = args.require
  const debug = verbose && args['verbose-sole-argument'] !== true
  if (debug) {
    console.log('require ' + requireLib)
    console.log('verbose ' + verbose)
    console.log('base-dir ' + baseDir)
  }
  const verboseMode = verbose ? 2 : 1
  const cliAttributes = args.attribute
  if (cliAttributes) {
    attributes.push(...cliAttributes)
  }
  if (debug) {
    console.log('verbose-mode ' + verboseMode)
    console.log('attributes ' + attributes)
  }
  const options = {
    safe: safeMode,
    verbose: verboseMode,
    sourcemap: true
  }
  if (baseDir != null) {
    options.base_dir = baseDir
  }
  options.attributes = attributes
  if (debug) {
    console.log('options ' + JSON.stringify(options))
  }
  return options
}

class Options {
  constructor (options) {
    this.options = options || {}
    this.args = {}
    if (Array.isArray(this.options.attributes)) {
      this.attributes = options.attributes
    } else if (typeof this.options.attributes === 'object') {
      const attrs = this.options.attributes
      const attributes = []
      Object.keys(attrs).forEach((key) => {
        attributes.push(`${key}=${attrs[key]}`)
      })
      this.attributes = attributes
    } else {
      this.attributes = []
    }
    this.cmd = yargs
      .option('base-dir', {
        // QUESTION: should we check that the directory exists ? coerce to a directory ?
        alias: 'B',
        describe: 'base directory containing the document and resources (default: directory of source file)',
        type: 'string'
      })
      .option('attribute', {
        alias: 'a',
        array: true,
        describe: 'a document attribute to set in the form of key, key! or key=value pair',
        type: 'string'
      })
      .version(false)
      .option('version', {
        alias: 'V',
        default: false,
        describe: 'display the version and runtime environment (or -v if no other flags or arguments)',
        type: 'boolean'
      })
      .help(true)
      .nargs('attribute', 1)
    this.yargs = yargs
  }

  parse (argv) {
    const processArgs = argv.slice(2)
    this.argv = argv
    const args = this.argsParser().parse(processArgs)
    Object.assign(this.args, args)
    this.args['verbose-sole-argument'] = this.args.verbose && processArgs.length === 1
    const options = convertOptions(this.args, this.attributes)
    Object.assign(this.options, options)
    return this
  }

  addOption (key, opt) {
    this.cmd.option(key, opt)
    return this
  }

  argsParser () {
    return this.yargs
      .detectLocale(false)
      .wrap(Math.min(120, this.yargs.terminalWidth()))
      .command('$0 [files...]', '', () => this.cmd)
      .parserConfiguration({
        'boolean-negation': false
      })
  }
}

module.exports = Options
