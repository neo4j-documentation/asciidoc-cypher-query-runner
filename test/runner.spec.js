const sinon = require('sinon')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const { run } = require('../lib/runner.js')
const catalog = require('../lib/catalog.js')
const neo4jSession = require('../lib/neo4j-session.js')

describe('runner', () => {
  it('should return a report', async () => {
    const getFilesStub = sinon.stub(catalog, 'getFiles')
    try {
      getFilesStub.returns(Promise.resolve(['foo.adoc']))
      sinon.stub(catalog, 'getCypherQueriesCatalog').returns({
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
      })
      sinon.stub(neo4jSession, 'connect').returns(Promise.resolve({}))
      sinon.stub(neo4jSession, 'execute').returns(Promise.resolve({}))
      sinon.stub(neo4jSession, 'getSession').returns({
        close: sinon.fake()
      })
      const result = await run({
        ignoreRoles: [],
        asciidoctorOptions: {},
        globPattern: '**/*.adoc',
        neo4jDriver: {}
      })
      expect(getFilesStub.calledOnce).to.be.true()
      expect(result).to.deep.include.members([{
        status: 'success',
        query: 'MATCH (n {name: \'B\'})\nRETURN n',
        output: {},
        sourceLocation: {
          lineNumber: 5,
          path: '/path/to/foo.adoc'
        }
      }])
    } finally {
      getFilesStub.restore()
    }
  })
})
