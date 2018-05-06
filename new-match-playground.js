const csstree = require('./lib');
const generic = require('./new-match-generic');
const data = require('./data');
const { buildMatchTree, match, matchAsTree } = require('./new-match');

const pattern = '<percentage>+';// || a || b || c || d || a || b || c || d || c';
// const pattern = 'normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> || stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero || <east-asian-variant-values> || <east-asian-width-values> || ruby ]';
// const ast = csstree.grammar.parse(pattern);
// console.log(csstree.grammar.generate(ast), '\n ------- \n');
const matchTree = buildMatchTree(pattern);
// process.exit();
const syntaxes = {
    types: {
        'foo': buildMatchTree('<bar>?'),
        'bar': buildMatchTree('<custom-ident>+')
    },
    properties: {}
};

for (var key in data.properties) {
    console.log('property', key);
    console.log('  ' + data.properties[key]);
    if (key === 'font-variant' || key === 'src') { console.log('skipped'); continue; }
    syntaxes.properties[key] = buildMatchTree(data.properties[key]);
}

syntaxes.types = Object.assign({}, generic, syntaxes.types);

for (var key in data.types) {
    console.log('type', key);
    if (key === 'transform-function') { console.log('skipped'); continue; }
    syntaxes.types[key] = buildMatchTree(data.types[key]);
}

function dump(val) {
    console.log(require('util').inspect(val, { depth: null }));
}
function parse(input) {
    return csstree.parse(input, { context: 'value' });
}
// const ast = csstree.grammar.parse('[a] | [a && b]');

// console.log(JSON.stringify(ast, null, 4));

// dump(matchTree);
// console.log(require('util').inspect(syntaxes.type.foo, { depth: null }));
// console.log(JSON.stringify(matchAsTree('1%', matchTree, syntaxes), null, 4));
console.log(JSON.stringify(match(parse('solid RED 1px'), syntaxes.properties.border, syntaxes), null, 4));
// console.log(JSON.stringify(internalMatch(['a', 'b'], matchTree), null, 4));
console.log('-----');
// dump(matchTree())

const t = Date.now();
const ast = parse('solid red 1px');
for (var i = 0; i < 1e5; i++) {
    if (i % 1e4 === 0) console.log(i);
    matchAsTree(ast, syntaxes.properties.border, syntaxes);
}
console.log(Date.now() - t);
