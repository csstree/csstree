const { buildMatchTree } = require('./lib/lexer/match-tree');
const { matchAsList, matchAsTree, getTotalIterationCount } = require('./lib/lexer/match');

// TODO: remove
process.on('exit', function() {
    console.log('TOTAL COUNT', getTotalIterationCount());
});

module.exports = {
    buildMatchTree: buildMatchTree,
    match: matchAsList,
    matchAsTree: matchAsTree
};
