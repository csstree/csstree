const csstree = require('./lib');
const { buildMatchTree, match } = require('./new-match');

const pattern = 'b#{2,4}';
const ast = csstree.grammar.parse(pattern);
const matchTree = buildMatchTree(pattern);
// const ast = csstree.grammar.parse('[a] | [a && b]');

// console.log(JSON.stringify(ast, null, 4));
console.log(csstree.grammar.generate(ast), '\n ------- \n');

console.log(require('util').inspect(matchTree, { depth: null }));
console.log(JSON.stringify(match('b, b, b', matchTree), null, 4));
// console.log(JSON.stringify(internalMatch(['a', 'b'], matchTree), null, 4));
