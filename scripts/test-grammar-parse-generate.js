import iterateSyntaxes from './utils/iterate-syntaxes.js';
import { definitionSyntax } from '../lib/index.js';

const { parse, generate } = definitionSyntax;
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

        if (name.slice(-2) === '()') {
            if (ast.type === 'Group') {
                const functionName = name.slice(0, -2);
                const isCorrectTerm = term => term.type === 'Function' && term.name === functionName;

                switch (ast.combinator) {
                    case ' ':
                        if (!isCorrectTerm(ast.terms[0])) {
                            reason = 'the first token of top level Group is not a function with expected name';
                            throw new Error('Bad syntax');
                        }
                        break;

                    case '|':
                        const allTermsIsCorrect = ast.terms.every(term => {
                            return (
                                isCorrectTerm(term) ||
                                (term.type === 'Group' && isCorrectTerm(term.terms[0]))
                            );
                        });

                        if (!allTermsIsCorrect) {
                            reason = 'some of top level Group is not a function with expected name';
                            throw new Error('Bad syntax');
                        }

                        break;

                    default:
                        reason = 'a root node should be a Group with combinator " " or "|"';
                        throw new Error('Bad syntax');
                }
            } else {
                reason = 'a root node should be a Group';
                throw new Error('Bad AST');
            }
        }

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
