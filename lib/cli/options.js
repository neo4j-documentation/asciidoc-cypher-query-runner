'use strict'

const commander = require('commander')
const version = require('../../package.json').version

function collect (value, previous) {
  return previous.concat([value])
}

class Options {
  constructor (options) {
    const self = this
    self.program = new commander.Command()
      .arguments('<files...>')
      .option('-B, --base-dir <directory>', 'base directory containing the document and resources (default: directory of source file)')
      .option('-a, --attribute <key=value>', 'a document attribute to set in the form of key, key! or key=value pair', collect, [])
      .option('-i, --ignore-role <role>', 'ignore Cypher source blocks with that role', collect, [])
      .option('--fail-fast', 'fail fast and exit when it encounters an error', false)
      .option('--reporter-error-limit <value>', 'limit error', 3)
      .addOption(new commander.Option('--reporter-error-format <format>', 'error format').choices(['short', 'full']).default('full'))
      .version(version, '-V, --version', 'display the version and runtime environment (or -v if no other flags or arguments)')
      .action((files) => {
        self.files = files
      })
  }

  parse (argv) {
    this.program.parse(argv)
    return this
  }
}

module.exports = Options
