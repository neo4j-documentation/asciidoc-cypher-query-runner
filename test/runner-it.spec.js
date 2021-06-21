const neo4j = require('neo4j-driver')
const { GenericContainer } = require('testcontainers')

describe('GenericContainer', () => {
  let container
  let neo4jDriver

  before(async function () {
    this.timeout(30000)
    try {
      container = await new GenericContainer('neo4j')
        .withEnv('NEO4J_AUTH', 'none')
        .withExposedPorts(7687)
        .start()
      const uri = `bolt://${container.getHost()}:${container.getMappedPort(7687)}`
      console.log(`Connecting to ${uri}`)
      neo4jDriver = neo4j.driver(`bolt://${container.getHost()}:${container.getMappedPort(7687)}`, neo4j.auth.basic('neo4j', 'neo4j'))
    } catch (e) {
      console.error('Something went wrong!', e)
    }
  })

  after(async () => {
    if (neo4jDriver) {
      await neo4jDriver.close()
    }
    if (container) {
      container.stop()
    }
  })

  it('works', async () => {
    const session = neo4jDriver.session()
    const r = await session.run('RETURN 1')
    console.log({ r })
  })
})
