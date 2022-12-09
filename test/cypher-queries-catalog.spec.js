/* eslint-env mocha */
'use strict'

const ospath = require('path')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const { fromFile } = require('../lib/cypher-query-catalog.js')

describe('Cypher queries catalog', () => {
  it('should get queries from existing AsciiDoc file', () => {
    const file = ospath.join(__dirname, 'fixtures', 'northwind-recommendation-engine.adoc')
    const result = fromFile(file, {})
    expect(result.error).to.be.undefined()
    expect(result.file).to.equal(file)
    expect(result.queries).to.have.lengthOf(9)
  })
  it('should return an error if file does not exist', () => {
    const file = ospath.join(__dirname, 'fixtures', 'non-existing.adoc')
    try {
      fromFile(file, {})
      expect.fail('must throw an exception when file does not exist')
    } catch (error) {
      expect(error).to.have.property('message')
      expect(error.message).to.includes('ENOENT')
    }
  })
})
