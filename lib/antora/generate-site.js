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

const aggregateContent = require('@antora/content-aggregator')
const buildPlaybook = require('@antora/playbook-builder')
const classifyContent = require('@antora/content-classifier')
const runCypherQueries = require('./run-cypher-queries.js')
const { resolveConfig: resolveAsciiDocConfig } = require('@antora/asciidoc-loader')

const asciidocCypherFailFast = process.env.ASCIIDOC_CYPHER_RUNNER_FAIL_FAST
const asciidocCypherReporterMode = process.env.ASCIIDOC_CYPHER_RUNNER_REPORTER_MODE || 'silent'
const asciidocCypherReporterErrorFormat = process.env.ASCIIDOC_CYPHER_RUNNER_REPORTER_ERROR_FORMAT || 'full'
const asciidocCypherIgnoreRoles = process.env.ASCIIDOC_CYPHER_RUNNER_IGNORE_ROLES || ''
const asciidocCypherReporterErrorLimit = parseInt(process.env.ASCIIDOC_CYPHER_RUNNER_REPORTER_ERROR_LIMIT || '3')

const Reporter = require('../reporter.js')

async function generateSite (args, env) {
  const playbook = buildPlaybook(args, env)
  const asciidocConfig = resolveAsciiDocConfig(playbook)
  const [contentCatalog] = await Promise.all([
    aggregateContent(playbook).then((contentAggregate) => classifyContent(playbook, contentAggregate, asciidocConfig)),
  ])
  const reporter = new Reporter({
    failFast: typeof asciidocCypherFailFast !== 'undefined'
  })
  const ignoreRoles = asciidocCypherIgnoreRoles.split(',').map((role) => role.trim()).filter((role) => role.length === 0)
  await runCypherQueries(contentCatalog, asciidocConfig, ignoreRoles, reporter)
  consola.log('Summary', reporter.getSummary())
  const errors = [...reporter.getErrors(), ...reporter.getFailures()]
  // detailled errors with limit
  if (errors && errors.length > 0) {
    if (errors.length > asciidocCypherReporterErrorLimit) {
      for (const error of errors.slice(0, asciidocCypherReporterErrorLimit)) {
        if (asciidocCypherReporterErrorFormat === 'short') {
          const location = error.sourceLocation ? `${error.sourceLocation.file}:${error.sourceLocation.lineNumber} ` : ''
          const errorMessage = error.cause && error.cause.message ? error.cause.message : error.error
          consola.error(`${location}${errorMessage}`)
        } else {
          consola.error(error)
        }
      }
      if (errors.length > asciidocCypherReporterErrorLimit) {
        consola.log(`...and ${errors.length - asciidocCypherReporterErrorLimit} more!`)
      }
    }
  }
}

module.exports = generateSite
