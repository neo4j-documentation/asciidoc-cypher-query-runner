'use strict'
const asciidoctor = require('asciidoctor.js')()
const createExtensionRegistry = require('@antora/asciidoc-loader/lib/create-extension-registry.js')
const resolveIncludeFile = require('@antora/asciidoc-loader/lib/include/resolve-include-file.js')
const consola = require('consola')

function toSourceLocation (sourceLocation) {
  if (sourceLocation === Opal.nil) {
    return undefined
  }
  sourceLocation.getFile = function () {
    var file = this.file
    return file === Opal.nil ? undefined : file
  }
  sourceLocation.getDirectory = function () {
    var dir = this.dir
    return dir === Opal.nil ? undefined : dir
  }
  sourceLocation.getPath = function () {
    var path = this.path
    return path === Opal.nil ? undefined : path
  }
  sourceLocation.getLineNumber = function () {
    var lineno = this.lineno
    return lineno === Opal.nil ? undefined : lineno
  }
  return sourceLocation
}

function toCypherQueriesCatalog (contentCatalog, { asciidocConfig, ingoreRoles }) {
  return contentCatalog.getPages().map((page) => {
    const extensionRegistry = createExtensionRegistry(asciidoctor, {
      onInclude: (doc, target, cursor) => resolveIncludeFile(target, page, cursor, contentCatalog),
    })
    const doc = asciidoctor.load(page.contents, { sourcemap: true, safe: 'safe', extension_registry: extensionRegistry, attributes: asciidocConfig.attributes })
    const queries = doc.findBy((block) => {
      if (block.getNodeName() === 'listing' && block.getStyle() === 'source' && block.getAttribute('language') === 'cypher') {
        const blockRoles = block.getRoles()
        if (ingoreRoles && blockRoles && ingoreRoles.some(ingoreRole => blockRoles.includes(ingoreRole))) {
          return false
        }
        return true
      }
      return false
    }).map((block) => {

      const sourceLocation = toSourceLocation(block.source_location)
      return {
        roles: block.getRoles(),
        sourceLocation,
        content: block.getSource()
      }
    })
    return {
      file: page.src.path,
      queries
    }
  }).filter((item) => item.queries.length > 0)
}

const CYPHER_QUERIES_SPLITTER_REGEX = /';\s*$\n?/gm
const neo4jSession = require('../neo4j-session.js')

async function runCypherQueries (contentCatalog, asciidocConfig) {
  // FIXME: option:
  //  - fail fast, first error -> exit!
  //  - reporter:
  //  - only error
  //  - summary only
  //  - withstacktrace
  const pages = contentCatalog.getPages()
  const cypherQueriesCatalog = toCypherQueriesCatalog(contentCatalog, { asciidocConfig, ingoreRoles: [] })
  const result = []
  const neo4jDriver = neo4jSession.getDriver()
  try {
    for (const cypherQueriesCatalogItem of cypherQueriesCatalog) {
      const session = await neo4jSession.getSession(neo4jDriver)
      try {
        for (const cypherQueryBlock of cypherQueriesCatalogItem.queries) {
          const queries = cypherQueryBlock.content.split(CYPHER_QUERIES_SPLITTER_REGEX).filter((query) => query.trim().length > 0)
          for (const query of queries) {
            const { sourceLocation } = cypherQueryBlock
            try {
              const response = await neo4jSession.execute(session, query)
              const inlineQuery = query.replace(/\n/g, ' ')
              const shortQuery = (inlineQuery.length > 50) ? inlineQuery.substr(0, 50 - 1) + '...' : inlineQuery
              consola.success(`${cypherQueriesCatalogItem.file}:${sourceLocation.getLineNumber()} - ${shortQuery}`)
              result.push({
                status: 'success',
                query,
                output: response,
                sourceLocation
              })
            } catch (err) {
              const inlineQuery = query.replace(/\n/g, ' ')
              const shortQuery = (inlineQuery.length > 50) ? inlineQuery.substr(0, 50 - 1) + '...' : inlineQuery
              consola.error(`${cypherQueriesCatalogItem.file}:${sourceLocation.getLineNumber()} - ${shortQuery}`, err)
              result.push({
                status: 'failure',
                cause: err,
                query,
                sourceLocation
              })
            }
          }
        }
      } finally {
        session.close()
      }
    }
  } finally {
    neo4jDriver.close()
  }
  return result
}

module.exports = runCypherQueries
