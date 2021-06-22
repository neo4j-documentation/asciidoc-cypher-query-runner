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
      const result = await runQueriesFromCatalog(cypherQueriesCatalog, {
        neo4jDriver: {},
        reporter
      })
      expect(executeStub.calledOnce).to.be.true()
      expect(reporter.getSuccess()).to.deep.include.members([
        {
          status: 'success',
          query: 'MATCH (n {name: \'B\'})\nRETURN n',
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
})
