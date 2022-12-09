'use strict'

const glob = require('glob')
const asciidoctor = require('@asciidoctor/core')()
const Opal = global.Opal

function toSourceLocation (sourceLocation) {
  if (sourceLocation === Opal.nil) {
    return {}
  }
  return {
    file: sourceLocation.file === Opal.nil ? undefined : sourceLocation.file,
    dir: sourceLocation.dir === Opal.nil ? undefined : sourceLocation.dir,
    path: sourceLocation.path === Opal.nil ? undefined : sourceLocation.path,
    lineNumber: sourceLocation.lineno === Opal.nil ? undefined : sourceLocation.lineno
  }
}

function extractCypherQueries (asciidoctorDocument, { ingoreRoles }) {
  return asciidoctorDocument.findBy((block) => {
    if (block.getNodeName() === 'listing' && block.getStyle() === 'source' && block.getAttribute('language') === 'cypher') {
      const blockRoles = block.getRoles()
      if (ingoreRoles && blockRoles && ingoreRoles.some(ingoreRole => blockRoles.includes(ingoreRole))) {
        return false
      }
      return true
    }
    return false
  }).map((block) => {
    const sourceLocation = toSourceLocation(block.source_location)
    return {
      roles: block.getRoles(),
      sourceLocation,
      content: block.getSource()
    }
  })
}

function fromPage (page, { ingoreRoles, asciidoctorOptions }) {
  const file = page.src.path
  const doc = asciidoctor.load(page.contents, asciidoctorOptions)
  return {
    file,
    queries: extractCypherQueries(doc, { ingoreRoles })
  }
}

function fromFile (file, { ingoreRoles, asciidoctorOptions }) {
  const doc = asciidoctor.loadFile(file, asciidoctorOptions)
  return {
    file,
    queries: extractCypherQueries(doc, { ingoreRoles })
  }
}

function fromFiles (files, { ingoreRoles, asciidoctorOptions }) {
  return files
    .map((file) => fromFile(file, { ingoreRoles, asciidoctorOptions }))
    .filter((item) => item && item.queries && item.queries.length > 0)
}

async function fromGlob (globPattern, { ingoreRoles, asciidoctorOptions }) {
  return new Promise((resolve, reject) => {
    glob(globPattern, {}, function (err, files) {
      if (err) {
        reject(err)
        return
      }
      resolve(fromFiles(files, { ingoreRoles, asciidoctorOptions }))
    })
  })
}

module.exports = {
  fromFile,
  fromFiles,
  fromPage,
  fromGlob
}
