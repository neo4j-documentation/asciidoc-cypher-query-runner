const ospath = require('path')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const { getCypherQueriesCatalog } = require('../lib/cypher-queries-catalog.js')

describe('cypher-queries-catalog', () => {
  it('should get queries from existing AsciiDoc file', () => {
    const file = ospath.join(__dirname, 'fixtures', 'northwind-recommendation-engine.adoc')
    const result = getCypherQueriesCatalog(file, {})
    expect(result.error).to.be.undefined()
    expect(result.file).to.equal(file)
    expect(result.queries).to.have.lengthOf(9)
  })
  it('should return an error if file does not exist', () => {
    const file = ospath.join(__dirname, 'fixtures', 'non-existing.adoc')
    const result = getCypherQueriesCatalog(file, {})
    expect(result.error).to.equal(`Unable to extract Cypher queries from file: ${file}`)
    expect(result.file).to.equal(file)
    expect(result.cause).to.have.property('message')
    expect(result.cause.message).to.includes('ENOENT')
  })
})
