// const consola = require('consola')

const neo4jSession = require('./neo4j-session.js')
const cypherQueryCatalog = require('./cypher-query-catalog.js')

const CYPHER_QUERIES_SPLITTER_REGEX = /;\s*$\n?/gm

async function runQueriesFromCatalog (cypherQueriesCatalog, { reporter, neo4jDriver, noExplain }) {
  for (const cypherQueriesCatalogPage of cypherQueriesCatalog) {
    const session = await neo4jSession.getSession(neo4jDriver)
    try {
      for (const cypherQueryBlock of cypherQueriesCatalogPage.queries) {
        const queries = cypherQueryBlock.content.split(CYPHER_QUERIES_SPLITTER_REGEX).filter((query) => query.trim().length > 0)
        for (const query of queries) {
          const currentQuery = noExplain ? query : `EXPLAIN ${query}`
          try {
            const response = await neo4jSession.execute(session, currentQuery)
            reporter.addSuccess({
              query: currentQuery,
              response,
              page: cypherQueriesCatalogPage,
              cypherQueryBlock
            })
          } catch (err) {
            reporter.addFailure({
              query: currentQuery,
              err,
              page: cypherQueriesCatalogPage,
              cypherQueryBlock
            })
          }
        }
      }
    } finally {
      session.close()
    }
  }
}

async function runFromFiles ({ ignoreRoles, noExplain, asciidoctorOptions, files, neo4jDriver, reporter }) {
  const cypherQueriesCatalog = await cypherQueryCatalog.fromFiles(files, { ignoreRoles, asciidoctorOptions })
  await runQueriesFromCatalog(cypherQueriesCatalog, { reporter, neo4jDriver, noExplain })
  return reporter
}

async function run ({ ignoreRoles, noExplain, asciidoctorOptions, globPattern, neo4jDriver, reporter }) {
  const cypherQueriesCatalog = await cypherQueryCatalog.fromGlob(globPattern, { ignoreRoles, asciidoctorOptions })
  await runQueriesFromCatalog(cypherQueriesCatalog, { reporter, neo4jDriver, noExplain })
  return reporter
}

module.exports = {
  run,
  runFromFiles,
  runQueriesFromCatalog
}
