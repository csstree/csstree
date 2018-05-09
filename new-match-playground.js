const csstree = require('./lib');
const generic = require('./lib/lexer/generic');
const data = require('./data');
const { buildMatchTree, match, matchAsTree } = require('./new-match');

const mem = process.memoryUsage();
const pattern = '<percentage>+';// || a || b || c || d || a || b || c || d || c';
// const pattern = 'normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> || stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero || <east-asian-variant-values> || <east-asian-width-values> || ruby ]';
// const ast = csstree.grammar.parse(pattern);
// console.log(JSON.stringify(ast, null, 4));
// process.exit();
// console.log(csstree.grammar.generate(ast), '\n ------- \n');
const matchTree = buildMatchTree(pattern);
// process.exit();
const syntaxes = {
    types: {
        // 'foo': buildMatchTree('<bar>?'),
        // 'bar': buildMatchTree('<custom-ident>+')
    },
    properties: {}
};

const buildStartTime = Date.now();
for (var key in data.properties) {
    console.log('property', key);
    console.log('  ' + data.properties[key]);
    if (/*key === 'font-variant' || */key === 'src') { console.log('skipped'); continue; }
    global.syntaxRef = 'property/' + key;
    syntaxes.properties[key] = {
        match: buildMatchTree(data.properties[key])
    };
}

for (var key in generic) {
    if (!syntaxes.types[key]) {
        syntaxes.types[key] = {
            match: {
                type: 'Generic',
                fn: generic[key]
            }
        };
    }
}

for (var key in data.types) {
    console.log('type', key);
    // if (key === 'rgb()') { console.log(data.types[key]);process.exit() }
    global.syntaxRef = 'type/' + key;
    syntaxes.types[key] = {
        match: buildMatchTree(data.types[key])
    };
}

console.log('Build time', Date.now() - buildStartTime);
console.log({ old: mem, new: process.memoryUsage() });
// process.exit();

function dump(val) {
    console.log(require('util').inspect(val, { depth: null }));
}
function parse(input) {
    return csstree.parse(input, { context: 'value' });
}
// const ast = csstree.grammar.parse('[a] | [a && b]');

// console.log(JSON.stringify(ast, null, 4));

// console.log(require('util').inspect(syntaxes.type.foo, { depth: null }));
// console.log(JSON.stringify(matchAsTree('1%', matchTree, syntaxes), null, 4));
const value = 'rgb(1 2 3)';
const syntax = syntaxes.properties.background;
// const matchResult = match(parse(value), syntax, syntaxes);
const matchResultTree = matchAsTree(parse(value), syntax.match, syntaxes);
// console.log(JSON.stringify(matchResult, null, 4));
// console.log(JSON.stringify(matchResultTree, null, 4));
console.log(require('util').inspect(matchResultTree));

if (matchResultTree.error) {
    console.log('Error');
    console.log(csstree.grammar.generate(syntax.match.syntax));
    console.log(matchResultTree.error.value);
    console.log(' '.repeat(matchResultTree.error.offset) + '^');
}

console.log(require('./lib').lexer.matchProperty('background', parse('rgb(1,2,3)')).error.message);

// console.log(JSON.stringify(internalMatch(['a', 'b'], matchTree), null, 4));
process.exit();
console.log('-----');
// dump(matchTree())

const t = Date.now();
const ast = parse('solid red 1px');
for (var i = 0; i < 1e5; i++) {
    if (i % 1e4 === 0) console.log(i);
    matchAsTree(ast, syntaxes.properties.border, syntaxes);
}
console.log(Date.now() - t);
