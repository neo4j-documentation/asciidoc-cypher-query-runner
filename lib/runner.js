// const consola = require('consola')

const neo4jSession = require('./neo4j-session.js')
const cypherQueryCatalog = require('./cypher-query-catalog.js')

const CYPHER_QUERIES_SPLITTER_REGEX = /';\s*$\n?/gm

async function runQueriesFromCatalog (cypherQueriesCatalog, { reporter, neo4jDriver }) {
  for (const cypherQueriesCatalogPage of cypherQueriesCatalog) {
    const session = await neo4jSession.getSession(neo4jDriver)
    try {
      for (const cypherQueryBlock of cypherQueriesCatalogPage.queries) {
        const queries = cypherQueryBlock.content.split(CYPHER_QUERIES_SPLITTER_REGEX).filter((query) => query.trim().length > 0)
        for (const query of queries) {
          const { sourceLocation } = cypherQueryBlock
          try {
            const response = await neo4jSession.execute(session, query)
            reporter.addSuccess({
              query,
              response,
              page: cypherQueriesCatalogPage,
              cypherQueryBlock
            })
          } catch (err) {
            reporter.addFailure({
              query,
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

async function runFromFiles ({ ignoreRoles, asciidoctorOptions, files, neo4jDriver, reporter }) {
  try {
    neo4jSession.connect(neo4jDriver)
  } catch (err) {
    reporter.addError({
      error: 'Unable to connect to Noe4j',
      cause: err
    })
    return reporter
  }
  const cypherQueriesCatalog = await cypherQueryCatalog.fromFiles(files, { ignoreRoles, asciidoctorOptions })
  return runQueriesFromCatalog(cypherQueriesCatalog, { reporter, neo4jDriver })
  return reporter
}

async function run ({ ignoreRoles, asciidoctorOptions, globPattern, neo4jDriver, reporter }) {
  try {
    neo4jSession.connect(neo4jDriver)
  } catch (err) {
    reporter.addError({
      error: 'Unable to connect to Noe4j',
      cause: err
    })
    return reporter
  }
  const cypherQueriesCatalog = await cypherQueryCatalog.fromGlob(globPattern, { ignoreRoles, asciidoctorOptions })
  return runQueriesFromCatalog(cypherQueriesCatalog, { reporter, neo4jDriver })
  return reporter
}

module.exports = {
  run,
  runQueriesFromCatalog
}
