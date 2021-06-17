

// 1. connect to database
// * create driver
// * create session
// * execute RETURN 1

// 2. For each AsciiDoc file
// * create session
// * execute RETURN 1 (make sure that the connection is still available)
// * For each cypher block
// ** split on ';'
// ** For each query
// *** execute query in a transaction function await session.writeTransaction(tx => tx.run('...'))

// Execute in parallel?

// Reporting:
const report = [
  {
    name: '',
    cypherQuery: {
      content: '',
      index: 0
    },
    output: {
      text: ''
    },
    sourceLocation: {
      path: 'foo.adoc',
      lineNumber: 12,
    },
    status: 'success'
  },
  {
    name: '',
    cypherQuery: {
      content: '',
      index: 0
    },
    output: {
      text: ''
    },
    sourceLocation: {
      path: 'foo.adoc',
      lineNumber: 12,
    },
    status: 'failure'
  },
  {
    name: '',
    file: 'foo.adoc',
    status: 'failure'
  },
]

