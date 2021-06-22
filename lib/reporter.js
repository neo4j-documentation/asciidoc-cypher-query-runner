const consola = require('consola')

class Reporter {
  constructor (options = {}) {
    this.checks = []
    this.options = options
  }

  addSuccess ({ query, response, page, cypherQueryBlock }) {
    const { sourceLocation } = cypherQueryBlock
    if (this.options.printSuccess) {
      consola.success(`${sourceLocation.file}:${sourceLocation.lineNumber}`)
    }
    const check = {
      status: 'success',
      query,
      output: response,
      sourceLocation
    }
    this.checks.push(check)
    return check
  }

  addFailure ({ query, err, page, cypherQueryBlock }) {
    const { sourceLocation } = cypherQueryBlock
    if (this.options.printFailure) {
      consola.error(`${sourceLocation.file}:${sourceLocation.lineNumber}`, err)
    }
    const check = {
      status: 'failure',
      cause: err,
      query,
      sourceLocation
    }
    this.checks.push(check)
    if (this.options.failFast) {
      consola.error(check)
      process.exit(1)
    }
    return check
  }

  addError (data) {
    const check = { ...data, status: 'error' }
    this.checks.push(check)
    if (this.options.failFast) {
      consola.error(check)
      process.exit(1)
    }
    return check
  }

  getSummary () {
    return {
      success: this.checks.filter((item) => item.status === 'success').length,
      failure: this.checks.filter((item) => item.status === 'failure').length,
      error: this.checks.filter((item) => item.status === 'error').length
    }
  }

  getErrors () {
    return this.checks.filter((item) => item.status === 'error')
  }

  getSuccess () {
    return this.checks.filter((item) => item.status === 'success')
  }

  getFailures () {
    return this.checks.filter((item) => item.status === 'failure')
  }
}

module.exports = Reporter
