const data = require('mdn-data/css');
const csstreeData = require('./data');
const parse = require('./lib').grammar.parse;
const generate = require('./lib').grammar.generate;
let problems = {};

function test(section, name, syntax) {
    let reason = 'parse error';
    const normSyntax = syntax
        .replace(/\n\s*/g, ' ');

    // if (/>[?+*{]/.test(syntax)) {
    //     console.log('#' + String(global.x = (global.x || 0) + 1).padEnd(3), section, name);
    //     console.log('  ', syntax);
    //     console.log();
    // }
    // return;

    try {
        const ast = parse(syntax);
        const restored = generate(ast);
        const roundtrip = generate(parse(restored));

        if (roundtrip !== restored) {
            reason = 'roundtrip broken';
            throw new Error([
                'Roundtrip doesn\'t work',
                '  Restored:  ' + restored,
                '  Roundtrip: ' + roundtrip
            ].join('\n'));
        }

        if (restored !== normSyntax) {
            reason = 'mismatch restored';
            throw new Error([
                'Restored syntax is not match',
                '  ' + restored
            ].join('\n'));
        }
    } catch (e) {
        problems[reason] = (problems[reason] || 0) + 1;
        console.log('##### ERROR');
        console.log(`${section}/${name}\n  ${normSyntax}`);
        console.log('#####', e.message);
        console.log();
    }
}

for (var name in data.atRules) {
    test('atRules', name, data.atRules[name].syntax);
    for (var descriptor in data.atRules[name].descriptors) {
        test('atRules/' + name, descriptor, data.atRules[name].descriptors[descriptor].syntax);
    }
}

for (var name in data.properties) {
    test('properties', name, data.properties[name].syntax);
}

for (var name in data.syntaxes) {
    test('syntaxes', name, data.syntaxes[name].syntax);
}

['properties', 'types'].forEach(function(section) {
    Object.keys(csstreeData[section]).forEach(function(name) {
        const csstreeSyntax = csstreeData[section][name];
        const mdnData = data[section === 'properties' ? 'properties' : 'syntaxes'][name];
        if (!mdnData || csstreeSyntax !== mdnData.syntax) {
            test('CSSTree ' + section, name, csstreeSyntax);
        }
    });
});

console.log(problems);
