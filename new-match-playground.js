const csstree = require('./lib');
const { buildMatchTree, match } = require('./new-match');

const pattern = 'x <foo> / b';
const ast = csstree.grammar.parse(pattern);
const matchTree = buildMatchTree(pattern);
const syntaxes = {
    type: {
        'foo': buildMatchTree('<bar>?'),
        'bar': buildMatchTree('<custom-ident>+')
    }
};
// const ast = csstree.grammar.parse('[a] | [a && b]');

// console.log(JSON.stringify(ast, null, 4));
console.log(csstree.grammar.generate(ast), '\n ------- \n');

console.log(require('util').inspect(matchTree, { depth: null }));
// console.log(require('util').inspect(syntaxes.type.foo, { depth: null }));
console.log(JSON.stringify(match('x x / b', matchTree, syntaxes), null, 4));
// console.log(JSON.stringify(internalMatch(['a', 'b'], matchTree), null, 4));
