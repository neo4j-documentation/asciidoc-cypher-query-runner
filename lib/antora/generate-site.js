'use strict'

const consola = require('consola')

const aggregateContent = require('@antora/content-aggregator')
const buildPlaybook = require('@antora/playbook-builder')
const classifyContent = require('@antora/content-classifier')
const runCypherQueries = require('./run-cypher-queries.js')
const { resolveConfig: resolveAsciiDocConfig } = require('@antora/asciidoc-loader')

async function generateSite (args, env) {
  const playbook = buildPlaybook(args, env)
  const asciidocConfig = resolveAsciiDocConfig(playbook)
  const [contentCatalog] = await Promise.all([
    aggregateContent(playbook).then((contentAggregate) => classifyContent(playbook, contentAggregate, asciidocConfig)),
  ])
  const reporter = await runCypherQueries(contentCatalog, asciidocConfig)
  console.log(reporter.getSummary())
  /*
  console.log(reporter.getErrors())
  console.log(reporter.getFailures())
   */
}

module.exports = generateSite
