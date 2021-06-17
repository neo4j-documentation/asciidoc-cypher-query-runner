const neo4j = require('neo4j-driver')

function getDriver (uri, user, password) {
  return neo4j.driver(uri, neo4j.auth.basic(user, password))
}

async function execute (query, session) {
  try {
    const result = await session.run(query)
    console.log({ result })
  } finally {
    await session.close()
  }
}

// on application exit
async function close (driver) {
  await driver.close()
}

module.exports = {
  execute,
  getDriver,
  close
}
