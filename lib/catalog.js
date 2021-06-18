const glob = require('glob')
const asciidoctor = require('@asciidoctor/core')()

function getCypherQueriesCatalog (file, { ingoreRoles, asciidoctorOptions }) {
  try {
    const doc = asciidoctor.loadFile(file, asciidoctorOptions)
    const queries = doc.findBy((block) => {
      if (block.getNodeName() === 'listing' && block.getStyle() === 'source' && block.getAttribute('language') === 'cypher') {
        const blockRoles = block.getRoles()
        if (ingoreRoles && blockRoles && ingoreRoles.some(ingoreRole => blockRoles.includes(ingoreRole))) {
          return false
        }
        return true
      }
      return false
    }).map((block) => ({
      roles: block.getRoles(),
      sourceLocation: block.getSourceLocation(),
      content: block.getSource()
    }))
    return {
      file,
      queries
    }
  } catch (e) {
    return {
      file,
      error: `Unable to extract Cypher queries from file: ${file}`,
      cause: e
    }
  }
}

async function getFiles (globPattern, options = {}) {
  return new Promise((resolve, reject) => {
    glob(globPattern, options, function (err, files) {
      if (err) {
        reject(err)
        return
      }
      resolve(files)
    })
  })
}

module.exports = {
  getCypherQueriesCatalog,
  getFiles
}
