'use strict'

class Invoker {
  constructor (options) {
    this.options = options
  }

  async invoke () {
    const programOpts = this.options.program.opts()
    const files = this.options.files
    console.log('invoke', { programOpts, files })
  }
}

module.exports = Invoker
