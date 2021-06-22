'use strict'

const ospath = require('path')
const { posix: path } = ospath

const asciidoctor = require('asciidoctor.js')()
const createExtensionRegistry = require('@antora/asciidoc-loader/lib/create-extension-registry.js')
const resolveIncludeFile = require('@antora/asciidoc-loader/lib/include/resolve-include-file.js')
const { EXAMPLES_DIR_TOKEN, PARTIALS_DIR_TOKEN } = require('@antora/asciidoc-loader/lib/constants.js')
const consola = require('consola')

const cypherQueryCatalog = require('../cypher-query-catalog.js')
const { runQueriesFromCatalog } = require('../runner.js')
const Reporter = require('../reporter.js')

function buildCacheKey ({ component, version }) {
  return version + '@' + component
}

function computeAsciiDocAttributes (page, asciidocConfig) {
  const { family, relative, extname = path.extname(relative) } = page.src
  const intrinsicAttrs = {
    docname: (family === 'nav' ? 'nav$' : '') + relative.substr(0, relative.length - extname.length),
    docfile: page.path,
    // NOTE docdir implicitly sets base_dir on document; Opal only expands value to absolute path if it starts with ./
    docdir: page.dirname,
    docfilesuffix: extname,
    // NOTE relfilesuffix must be set for page-to-page xrefs to work correctly
    relfilesuffix: '.adoc',
    examplesdir: EXAMPLES_DIR_TOKEN,
    partialsdir: PARTIALS_DIR_TOKEN,
  }
  const attributes = family === 'page' ? { 'page-partial': '@' } : {}
  Object.assign(attributes, asciidocConfig.attributes, intrinsicAttrs)
  if (page.pub) {
    Object.assign(attributes, {
      imagesdir: path.join(page.pub.moduleRootPath, '_images'),
      attachmentsdir: path.join(page.pub.moduleRootPath, '_attachments')
    })
  }
  return attributes
}

function toCypherQueriesCatalog (contentCatalog, { reporter, siteAsciiDocConfig, ingoreRoles }) {
  const mainAsciiDocConfigs = new Map()
  contentCatalog.getComponents().forEach(({ name: component, versions }) => {
    versions.forEach(({ version, asciidoc }) => {
      mainAsciiDocConfigs.set(buildCacheKey({ component, version }), asciidoc)
    })
  })
  return contentCatalog.getPages()
    .filter((page) => page.mediaType === 'text/asciidoc')
    .map((page) => {
      const extensionRegistry = createExtensionRegistry(asciidoctor, {
        onInclude: (doc, target, cursor) => resolveIncludeFile(target, page, cursor, contentCatalog),
      })
      const asciidoctorOptions = {
        sourcemap: true,
        safe: 'safe',
        extension_registry: extensionRegistry,
        attributes: computeAsciiDocAttributes(page, mainAsciiDocConfigs.get(buildCacheKey(page.src)) || siteAsciiDocConfig)
      }
      try {
        return cypherQueryCatalog.fromPage(page, { ingoreRoles, asciidoctorOptions })
      } catch (err) {
        const file = page.src.path
        reporter.addError({
          file,
          error: `Unable to extract Cypher queries from file: ${file}`,
          cause: err
        })
        return {}
      }
    }).filter((item) => item && item.queries && item.queries.length > 0)
}

const CYPHER_QUERIES_SPLITTER_REGEX = /';\s*$\n?/gm
const neo4jSession = require('../neo4j-session.js')

async function runCypherQueries (contentCatalog, siteAsciiDocConfig) {
  // FIXME: option:
  //  - fail fast, first error -> exit!
  //  - reporter:
  //  - only error
  //  - summary only
  //  - withstacktrace
  const pages = contentCatalog.getPages()
  const reporter = new Reporter()
  const cypherQueriesCatalog = toCypherQueriesCatalog(contentCatalog, { reporter, siteAsciiDocConfig, ingoreRoles: [] })
  const neo4jDriver = neo4jSession.getDriver()
  try {
    await runQueriesFromCatalog(cypherQueriesCatalog, {reporter, neo4jDriver})
  } finally {
    neo4jDriver.close()
  }
  return reporter
}

module.exports = runCypherQueries
