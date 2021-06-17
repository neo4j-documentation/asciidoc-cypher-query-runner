const asciidocProcessor = require('./asciidoc.js')
const queryRunner = require('./query.js')

const neo4jDatabaseUri = process.env['NEO4J_DATABASE_URI'] || 'neo4j://localhost'
const neo4jDatabaseUser = process.env['NEO4J_DATABASE_USER'] || 'neo4j'
const neo4jDatabasePassword = process.env['NEO4J_DATABASE_PASSWORD'] || 'neo4j'
// optional
const neo4jDatabaseName = process.env['NEO4J_DATABASE_NAME']

const driver = queryRunner.getDriver(neo4jDatabaseUri, neo4jDatabaseUser, neo4jDatabasePassword)
const cypherQueryCatalog = asciidocProcessor.getCypherQueries('northwind-recommendation-engine.adoc')

;(async () => {
  try {
    for (const item of cypherQueryCatalog) {
      console.log(item.content)
      const queries = item.content.split(new RegExp(';\s*$\n?', 'gm')).filter((query) => query.trim().length > 0)
      for (const query of queries) {
        console.log(`Executing query: ${query}...`)
        try {
          const sessionConfig = neo4jDatabaseName ? { database: neo4jDatabaseName } : {}
          const session = driver.session(sessionConfig)
          await queryRunner.execute(query, session)
        } catch (e) {

        }
      }
    }
  } catch (e) {
    console.error('Something went wrong', e)
  } finally {
    queryRunner.close(driver)
  }
})()
