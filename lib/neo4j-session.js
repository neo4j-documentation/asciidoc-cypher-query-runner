const neo4j = require('neo4j-driver')

const neo4jDatabaseUri = process.env.NEO4J_DATABASE_URI || 'bolt://localhost'
const neo4jDatabaseUser = process.env.NEO4J_DATABASE_USER || 'neo4j'
const neo4jDatabasePassword = process.env.NEO4J_DATABASE_PASSWORD || 'neo4j'
// optional
const neo4jDatabaseName = process.env.NEO4J_DATABASE_NAME
const neo4jConnectionAcquisitionTimeoutSeconds = process.env.NEO4J_CONNECTION_ACQUISITION_TIMEOUT_SECONDS || '10'

function getDriver () {
  return neo4j.driver(neo4jDatabaseUri, neo4j.auth.basic(neo4jDatabaseUser, neo4jDatabasePassword), {
    connectionAcquisitionTimeout: parseInt(neo4jConnectionAcquisitionTimeoutSeconds) * 1000
  })
}

async function getSession (driver) {
  const sessionConfig = neo4jDatabaseName ? { database: neo4jDatabaseName } : {}
  return driver.session(sessionConfig)
}

async function connect (driver) {
  const session = getSession(driver)
  return session.run('RETURN 1')
}

async function execute (session, query) {
  return session.writeTransaction(tx => tx.run(query))
}

module.exports = {
  getDriver,
  getSession,
  connect,
  execute
}
