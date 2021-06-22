'use strict'

const consola = require('consola')
const fancyReporter = new consola.FancyReporter({
  formatOptions: {
    date: false,
    colors: true,
    compact: false
  }
})
consola.setReporters(fancyReporter)

const { runFromFiles } = require('../runner.js')
const neo4jSession = require('../neo4j-session.js')
const Reporter = require('../reporter.js')

class Invoker {
  constructor (options) {
    this.options = options
  }

  async invoke () {
    const programOpts = this.options.program.opts()
    const files = this.options.files
    const { reporterErrorFormat, reporterErrorLimit, ignoreRole: ignoreRoles, attribute: attributes } = programOpts
    const asciidoctorOptions = {
      attributes,
      sourcemap: true,
      safe: 'safe'
    }
    const reporter = new Reporter({
      failFast: programOpts.failFast
    })
    const neo4jDriver = neo4jSession.getDriver()
    try {
      await runFromFiles({ ignoreRoles, asciidoctorOptions, files, reporter, neo4jDriver })
    } finally {
      neo4jDriver.close()
    }
    consola.log('Summary', reporter.getSummary())
    const errors = [...reporter.getErrors(), ...reporter.getFailures()]
    // detailled errors with limit
    if (errors && errors.length > 0) {
      if (errors.length > reporterErrorLimit) {
        for (const error of errors.slice(0, reporterErrorLimit)) {
          if (reporterErrorFormat === 'short') {
            const location = error.sourceLocation ? `${error.sourceLocation.file}:${error.sourceLocation.lineNumber} ` : ''
            const errorMessage = error.cause && error.cause.message ? error.cause.message : error.error
            consola.error(`${location}${errorMessage}`)
          } else {
            consola.error(error)
          }
        }
        if (errors.length > reporterErrorLimit) {
          consola.log(`...and ${errors.length - reporterErrorLimit} more!`)
        }
      }
      process.exit(1)
    }
  }
}

module.exports = Invoker
