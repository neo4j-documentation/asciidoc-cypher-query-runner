const asciidoctor = require('@asciidoctor/core')()

/**
 * FIXME: returns a List of Either.
 * @param files
 * @param ingoreRoles
 * @param asciidoctorOptions
 */
function getCypherQueriesCatalog(files, { ingoreRoles, asciidoctorOptions }) {
  return files.map((file) => {
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
        message: `Unable to extract Cypher queries from file: ${file}`,
        error: e
      }
    }
  })
}

module.exports = {
  getCypherQueriesCatalog
}

