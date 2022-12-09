/* eslint-env mocha */
'use strict'

const neo4j = require('neo4j-driver')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const { GenericContainer } = require('testcontainers')

describe.skip('Integration tests', () => {
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

  it('should execute query against Neo4j Docker instance', async () => {
    const session = neo4jDriver.session()
    try {
      await session.run('RETURN 1')
      // success!
    } catch (err) {
      // failure
      expect.fail('Unable to connecto to Neo4j', err)
    }
  })
})
