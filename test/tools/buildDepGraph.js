const fs = require('fs')
const path = require('path')

const madge = require('madge')

const buildDepGraph = async (rootPath, diagramPath, delRoot = false) => {
  const result = await madge(
    rootPath,
    {
      fontSize: '10px',
      backgroundColor: '#FFFFFF',
      cyclicNodeColor: '#F00000',
      edgeColor: '#666666',
      graphVizOptions: {
        G: {
          rankdir: 'LR'
        }
      },
      includeNpm: true,
      nodeColor: '#000000',
      noDependencyColor: '#008000'
    }
  )
  const output = await result.svg()
  fs.writeFileSync(diagramPath, output.toString())
  console.log('Diagram saved to ' + path.resolve(diagramPath))
  if (delRoot) {
    console.log(`Deleting '${rootPath}'...`)
    fs.unlinkSync(rootPath)
  }
}

module.exports = buildDepGraph