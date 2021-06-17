const asciidoctor = require('@asciidoctor/core')()

function getCypherQueries(fileName) {
  const doc = asciidoctor.loadFile(fileName, { sourcemap: true })
  return doc.findBy((block) => {
    if (block.getNodeName() === 'listing' && block.getStyle() === 'source' && block.getAttribute('language') === 'cypher') {
      // TODO: filter per role
      return true
    }
    return false
  }).map((block) => ({
    roles: block.getRoles(),
    sourceLocation: block.getSourceLocation(),
    content: block.getSource()
  }))
}

module.exports = {
  getCypherQueries
}

