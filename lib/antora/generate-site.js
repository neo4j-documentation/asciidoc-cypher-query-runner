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
  const report = await runCypherQueries(contentCatalog, asciidocConfig)

  const successCount = report.filter((item) => item.status === 'success').length
  const failureCount = report.filter((item) => item.status !== 'success').length
  consola.info(`Summary:`)
  consola.log(` - success: ${successCount}`)
  consola.log(` - failure: ${failureCount}`)
  //console.log({ report })
}

module.exports = generateSite
