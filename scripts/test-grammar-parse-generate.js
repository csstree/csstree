const iterateSyntaxes = require('./utils/iterate-syntaxes');
const parse = require('../lib').grammar.parse;
const generate = require('../lib').grammar.generate;
const problems = {};

iterateSyntaxes(function(section, name, syntax) {
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
});

console.log(problems);
