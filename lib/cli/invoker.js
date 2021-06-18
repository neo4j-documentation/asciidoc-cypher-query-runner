const ospath = require('path')
const asciidoctor = require('@asciidoctor/core')()
const pkg = require('../package.json')
const processor = require('./processor.js')
const { getCypherQueriesCatalog } = require('./asciidoc.js')

const DOT_RELATIVE_RX = new RegExp(`^\\.{1,2}[/${ospath.sep.replace('/', '').replace('\\', '\\\\')}]`)

class Invoker {
  constructor (options) {
    this.options = options
  }

  async invoke () {
    const processArgs = this.options.argv.slice(2)
    const { args } = this.options
    const { verbose, version, files } = args
    if (version || (verbose && processArgs.length === 1)) {
      this.showVersion()
      process.exit(0)
    }
    Invoker.prepareProcessor(args, asciidoctor)
    const options = this.options.options
    if (files && files.length > 0) {
      await Invoker.processFiles(files, verbose, args.timings, options)
    } else {
      this.showHelp()
    }
    process.exit(0)
  }

  showHelp () {
    this.options.yargs.showHelp()
  }

  showVersion () {
    console.log(this.version())
  }

  version () {
    const releaseName = process.release ? process.release.name : 'node'
    return `AsciiDoc Cypher Query Runner ${asciidoctor.getVersion()} (Asciidoctor ${asciidoctor.getCoreVersion()}) [https://asciidoctor.org]
Runtime Environment (${releaseName} ${process.version} on ${process.platform})
CLI version ${pkg.version}`
  }

  /**
   * @deprecated Use {#showVersion}. Will be removed in version 4.0.
   */
  static printVersion () {
    console.log(new Invoker().version())
  }

  static async processFiles (files, verbose, timings, options) {
    const cypherQueriesCatalog = getCypherQueriesCatalog(files, { ignoreRoles: [], asciidoctorOptions: options })
    await processor.execute(cypherQueriesCatalog)
  }

  static requireLibrary (requirePath, cwd = process.cwd()) {
    if (requirePath.charAt(0) === '.' && DOT_RELATIVE_RX.test(requirePath)) {
      // NOTE require resolves a dot-relative path relative to current file; resolve relative to cwd instead
      requirePath = ospath.resolve(requirePath)
    } else if (!ospath.isAbsolute(requirePath)) {
      // NOTE appending node_modules prevents require from looking elsewhere before looking in these paths
      const paths = [cwd, ospath.dirname(__dirname)].map((start) => ospath.join(start, 'node_modules'))
      requirePath = require.resolve(requirePath, { paths })
    }
    return require(requirePath)
  }

  static prepareProcessor (argv, asciidoctor) {
    const requirePaths = argv.require
    if (requirePaths) {
      requirePaths.forEach((requirePath) => {
        const lib = Invoker.requireLibrary(requirePath)
        if (lib && typeof lib.register === 'function') {
          // REMIND: it could be an extension or a converter.
          // the register function on a converter does not take any argument
          // but the register function on an extension expects one argument (the extension registry)
          // Until we revisit the API for extension and converter, we pass the registry as the first argument
          lib.register(asciidoctor.Extensions)
        }
      })
    }
  }

  static exit (code) {
    process.exit(code)
  }
}

module.exports = Invoker
