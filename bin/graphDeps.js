
const path = require('path')

const buildDepGraph =  require('../test/tools/buildDepGraph')
const buildRequireAllConcerns = require('../test/tools/buildRequireAllConcerns')
const buildRequireAllUtils = require('../test/tools/buildRequireAllUtils')

const CONCERNS_DIAGRAM_PATH = path.join(__dirname, '../test/unit/concernsDepGraph.svg')
const CONCERNS_ROOT_PATH = path.join(__dirname, '../utilities/lib/concerns/CONCERNS')

const UTILS_DIAGRAM_PATH = path.join(__dirname, '../test/unit/utilsDepGraph.svg')
const UTILS_ROOT_PATH = path.join(__dirname, '../utilities/UTILITIES')



buildRequireAllConcerns(CONCERNS_ROOT_PATH)
buildDepGraph(CONCERNS_ROOT_PATH, CONCERNS_DIAGRAM_PATH, true)

buildRequireAllUtils(UTILS_ROOT_PATH)
buildDepGraph(UTILS_ROOT_PATH, UTILS_DIAGRAM_PATH, true)
