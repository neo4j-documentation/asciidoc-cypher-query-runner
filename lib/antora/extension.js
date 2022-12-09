'use strict'

/**
 * Run Cypher queries for an Antora documentation site.
 *
 * @module cypher-queries-extension
 */
function register ({ config: { failFast = true, noExplain = true, reporterErrorLimit = 3, reporterErrorFormat = 'full', ingoreRoles = '', ...unknownOptions } }) {
  const logger = this.getLogger(packageName)

  if (Object.keys(unknownOptions).length) {
    const keys = Object.keys(unknownOptions)
    throw new Error(`Unrecognized option${keys.length > 1 ? 's' : ''} specified for ${packageName}: ${keys.join(', ')}`)
  }

  this.on('contentClassified', ({ playbook, siteAsciiDocConfig, siteCatalog, contentCatalog }) => {
    const reporter = new Reporter({
      failFast: failFast === true
    })
    const ignoreRoles = ingoreRoles.split(',').map((role) => role.trim()).filter((role) => role.length === 0)
    await runCypherQueries(contentCatalog, siteAsciiDocConfig, ignoreRoles, noExplain, reporter)

    const errors = [...reporter.getErrors(), ...reporter.getFailures()]
    // detailled errors with limit
    if (errors && errors.length > 0) {
      for (const error of errors.slice(0, reporterErrorLimit)) {
        if (reporterErrorFormat === 'short') {
          const location = error.sourceLocation ? `${error.sourceLocation.file}:${error.sourceLocation.lineNumber} ` : ''
          const errorMessage = error.cause && error.cause.message ? error.cause.message : error.error
          logger.error(`${location}${errorMessage}`)
        } else {
          logger.error(error)
        }
      }
      if (errors.length > reporterErrorLimit) {
        logger.log(`...and ${errors.length - reporterErrorLimit} more!`)
      }
    }
    logger.log('Summary', reporter.getSummary())
    process.exit(errors && errors.length > 0 ? 1 : 0)
  })
}

module.exports = { register }
