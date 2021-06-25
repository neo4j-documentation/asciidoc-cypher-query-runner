'use strict'

const ospath = require('path')
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
    const { reporterErrorFormat, reporterErrorLimit, ignoreRole: ignoreRoles, attribute: attributes, noExplain } = programOpts
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
      await runFromFiles({ ignoreRoles, noExplain, asciidoctorOptions, files, reporter, neo4jDriver })
    } finally {
      neo4jDriver.close()
    }
    const errors = [...reporter.getErrors(), ...reporter.getFailures()]
    // detailled errors with limit
    if (errors && errors.length > 0) {
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
    const summary = reporter.getSummary()
    const cwd = process.cwd()
    // question: should we use a flag to enable with feature? "--reporter-error-per-file-limit=0" to disable it?
    if (errors && errors.length > 0) {
      const errorCountFiles = new Map()
      for (const error of errors) {
        const file = error.sourceLocation ? ospath.relative(cwd, error.sourceLocation.file) : '<unknown>'
        const count = errorCountFiles.get(file) || 0
        errorCountFiles.set(file, count + 1)
      }
      const filesWithError = Object.fromEntries(Array.from(errorCountFiles.entries())
        .sort(([_, a], [__, b]) => b - a))
      consola.log('Summary', { ...summary, filesWithError })
    } else {
      consola.log('Summary', summary)
    }
    process.exit(errors && errors.length > 0 ? 1 : 0)
  }
}

module.exports = Invoker
