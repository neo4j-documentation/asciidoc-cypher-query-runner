// const consola = require('consola')

const neo4jSession = require('./neo4j-session.js')
const catalog = require('./catalog.js')

const CYPHER_QUERIES_SPLITTER_REGEX = /';\s*$\n?/gm

async function run ({ ignoreRoles, asciidoctorOptions, globPattern, neo4jDriver }) {
  try {
    neo4jSession.connect(neo4jDriver)
  } catch (err) {
    return {
      status: 'failure',
      error: 'Unable to connect to Noe4j',
      cause: err
    }
  }
  const files = await catalog.getFiles(globPattern)
  const result = []
  if (files) {
    for (const file of files) {
      const session = neo4jSession.getSession(neo4jDriver)
      try {
        const cypherQueriesCatalog = catalog.getCypherQueriesCatalog(file, { ignoreRoles, asciidoctorOptions })
        for (const cypherQueryBlock of cypherQueriesCatalog.queries) {
          const queries = cypherQueryBlock.content.split(CYPHER_QUERIES_SPLITTER_REGEX).filter((query) => query.trim().length > 0)
          for (const query of queries) {
            const { sourceLocation } = cypherQueryBlock
            try {
              const response = await neo4jSession.execute(session, query)
              // consola.success(`${file}:${sourceLocation.lineNumber} - ${query.replace(/\n/, ' ')}`)
              result.push({
                status: 'success',
                query,
                output: response,
                sourceLocation
              })
            } catch (err) {
              result.push({
                status: 'failure',
                cause: err,
                query,
                sourceLocation
              })
            }
          }
        }
      } catch (err) {
        result.push({
          status: 'failure',
          error: 'Unexpected error',
          cause: err
        })
      } finally {
        session.close()
      }
    }
  }
  return result
}

module.exports = {
  run
}
