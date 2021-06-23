const sinon = require('sinon')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const { runQueriesFromCatalog } = require('../lib/runner.js')
const Reporter = require('../lib/reporter.js')
const neo4jSession = require('../lib/neo4j-session.js')

describe('Runner', () => {
  it('should return a report', async () => {
    const connectStub = sinon.stub(neo4jSession, 'connect')
    const executeStub = sinon.stub(neo4jSession, 'execute')
    const getSessionStub = sinon.stub(neo4jSession, 'getSession')
    try {
      connectStub.returns(Promise.resolve({}))
      executeStub.returns(Promise.resolve({}))
      getSessionStub.returns({
        close: sinon.fake()
      })
      const reporter = new Reporter()
      const cypherQueriesCatalog = [{
        queries: [
          {
            content: `MATCH (n {name: 'B'})
RETURN n`,
            sourceLocation: {
              lineNumber: 5,
              path: '/path/to/foo.adoc'
            }
          }
        ]
      }]
      await runQueriesFromCatalog(cypherQueriesCatalog, {
        neo4jDriver: {},
        reporter
      })
      expect(executeStub.calledOnce).to.be.true()
      expect(reporter.getSuccess()).to.deep.include.members([
        {
          status: 'success',
          query: 'EXPLAIN MATCH (n {name: \'B\'})\nRETURN n',
          output: {},
          sourceLocation: { lineNumber: 5, path: '/path/to/foo.adoc' }
        }
      ])
    } finally {
      connectStub.restore()
      executeStub.restore()
      getSessionStub.restore()
    }
  })
  it('should split queries', async () => {
    const connectStub = sinon.stub(neo4jSession, 'connect')
    const executeStub = sinon.stub(neo4jSession, 'execute')
    const getSessionStub = sinon.stub(neo4jSession, 'getSession')
    try {
      connectStub.returns(Promise.resolve({}))
      executeStub.returns(Promise.resolve({}))
      getSessionStub.returns({
        close: sinon.fake()
      })
      const reporter = new Reporter()
      const cypherQueriesCatalog = [{
        queries: [
          {
            content: `CREATE CONSTRAINT ON (a:Article) ASSERT a.index IS UNIQUE;
CREATE CONSTRAINT ON (a:Author) ASSERT a.name IS UNIQUE;
CREATE CONSTRAINT ON (v:Venue) ASSERT v.name IS UNIQUE;`,
            sourceLocation: {
              lineNumber: 5,
              path: '/path/to/foo.adoc'
            }
          }
        ]
      }]
      await runQueriesFromCatalog(cypherQueriesCatalog, {
        neo4jDriver: {},
        reporter
      })
      const calls = executeStub.getCalls()
      expect(calls.length).to.equal(3)
      expect(calls[0].args[1]).to.equal('EXPLAIN CREATE CONSTRAINT ON (a:Article) ASSERT a.index IS UNIQUE')
      expect(calls[1].args[1]).to.equal('EXPLAIN CREATE CONSTRAINT ON (a:Author) ASSERT a.name IS UNIQUE')
      expect(calls[2].args[1]).to.equal('EXPLAIN CREATE CONSTRAINT ON (v:Venue) ASSERT v.name IS UNIQUE')
    } finally {
      connectStub.restore()
      executeStub.restore()
      getSessionStub.restore()
    }
  })
})
