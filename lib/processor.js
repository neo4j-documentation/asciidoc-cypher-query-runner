const neo4j = require('neo4j-driver')

const neo4jDatabaseUri = process.env['NEO4J_DATABASE_URI'] || 'neo4j://localhost'
const neo4jDatabaseUser = process.env['NEO4J_DATABASE_USER'] || 'neo4j'
const neo4jDatabasePassword = process.env['NEO4J_DATABASE_PASSWORD'] || 'neo4j'
// optional
const neo4jDatabaseName = process.env['NEO4J_DATABASE_NAME']

async function execute(cypherQueriesCatalog) {
  const driver = neo4j.driver(neo4jDatabaseUri, neo4j.auth.basic(neo4jDatabaseUser, neo4jDatabasePassword))
  try {
    const sessionConfig = neo4jDatabaseName ? { database: neo4jDatabaseName } : {}
    const session = driver.session(sessionConfig)
    try {
      await session.run('RETURN 1')
      try {
        for (const item of cypherQueriesCatalog) {
          if (item.error) {
            console.error(`KO: ${item.message}`)
            continue
          }
          if (!item.queries || item.queries.length === 0) {
            console.log('OK: no query')
            continue
          }
          const { queries: cypherQueryBlocks } = item
          for (const cypherQueryBlock of cypherQueryBlocks) {
            const queries = cypherQueryBlock.content.split(new RegExp(';\s*$\n?', 'gm')).filter((query) => query.trim().length > 0)
            for (const query of queries) {
              // create one test per query
              try {
                await session.run(query)
                // success
                console.log(`OK: ${query}`)
              } catch (e) {
                const sourceLocation = cypherQueryBlock.sourceLocation
                // failure!
                console.error(`KO: ${e.message}`, { path: sourceLocation.getPath(), lineno: sourceLocation.getLineNumber() })
              }
            }
          }
        }
      } catch (e) {
        console.error('KO: Unexpected error', e)
      }
    } catch (e) {
      console.error('KO: Unable to connect to Neo4j', e)
    }
  } finally {
    await driver.close()
  }
}

module.exports = {
  execute
}
