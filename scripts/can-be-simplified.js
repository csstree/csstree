import iterateSyntaxes from './utils/iterate-syntaxes.js';
import { definitionSyntax } from '../lib/index.js';

const { parse, generate, walk } = definitionSyntax;
let suggestions = [];

iterateSyntaxes(function(section, name, syntax) {
    function underlineFragment(ast, highlightNode, replacement) {
        return generate(ast, function(str, node) {
            if (node === highlightNode.term) {
                return replacement ? '' : '\x00'.repeat(str.length);
            }

            return node === highlightNode
                ? '\x00'.repeat((replacement ? generate(replacement) : str).length)
                : str;
        }).replace(/./g, m => m === '\x00' ? '~' : ' ');
    }

    function replaceFragment(ast, from, to) {
        return generate(ast, (str, node) =>
            node === from ? generate(to) : node === from.term ? '' : str
        );
    }

    function makeSuggestion(message, from, to) {
        suggestions.push({
            section,
            name,
            syntax,
            message,
            details: [
                `# ${id}`,
                message,
                'Current syntax:   ' + generate(ast),
                '                  ' + underlineFragment(ast, from),
                'Suggested syntax: ' + replaceFragment(ast, from, to),
                '                  ' + underlineFragment(ast, from, to),
                ''
            ].join('\n')
        });
    }

    const id = `${section} "${name}"`;
    const stack = [];
    let ast;

    try {
        ast = parse(syntax);

        walk(ast, {
            enter(node) {
                if (node.type === 'Group' && node.explicit && !node.disallowEmpty) {
                    // a group with no multiplier
                    if (!stack.length || stack[stack.length - 1].type !== 'Multiplier') {
                        if (node.terms.length === 1) {
                            makeSuggestion(
                                'A single term group with no multiplier can be omitted',
                                node,
                                node.terms[0]
                            );
                        }
                        // } else if (node.combinator === ' ') {
                        //     makeSuggestion(
                        //         '!!',
                        //         node,
                        //         node.terms[0]
                        //     );
                        // }
                    }
                }

                if (node.opts && node.opts.type === 'Range') {
                    if (node.opts.min === null && node.opts.max === null) {
                        makeSuggestion(
                            'Range [−∞,∞] is redundant',
                            node,
                            { ...node, opts: null }
                        );
                    }
                }

                if (node.type === 'Multiplier') {
                    if (node.term.type === 'Group') {
                        // a group with a single term, which is a keyword, a group, a type or a property with no a multiplier
                        // [ <term> ]<multipler> -> <term><multiplier>
                        if (node.term.terms.length === 1) {
                            const termType = node.term.terms[0].type;
                            if (termType === 'Keyword' || termType === 'Group' || termType === 'Type' || termType === 'Property') {
                                makeSuggestion(
                                    'A single term group can be omitted and a multiplier moved to a term',
                                    node,
                                    Object.assign({}, node, {
                                        term: node.term.terms[0]
                                    })
                                );
                            }
                        }

                        // if a group starts or ends with a comma
                        if (node.term.terms[0].type === 'Comma' || node.term.terms[node.term.terms.length - 1].type === 'Comma') {
                            const parent = stack.length ? stack[stack.length - 1] : null;
                            if (parent && parent.type === 'Group' && parent.combinator === ' ' && node.term.combinator === ' ') {
                                if (node.term.terms[0].type === 'Comma') {
                                    // comma at the beginning
                                    // <seq> [, <seq> ]<multiplier> -> <seq>#<multiplier + 1>
                                    const pos = parent.terms.indexOf(node);
                                    const start = Math.max(0, pos - node.term.terms.length + 1);
                                    const seq = {
                                        type: 'Group',
                                        terms: node.term.terms.slice(1),
                                        combinator: node.term.combinator,
                                        explicit: false,
                                        disallowEmpty: false
                                    };
                                    const prevSeq = {
                                        type: 'Group',
                                        terms: parent.terms.slice(start, pos),
                                        combinator: parent.combinator,
                                        explicit: false,
                                        disallowEmpty: false
                                    };

                                    if (generate(seq) === generate(prevSeq)) {
                                        // group a terms for a while
                                        prevSeq.terms = parent.terms.splice(start, node.term.terms.length, prevSeq);

                                        makeSuggestion(
                                            'A sequence can be rolled up',
                                            prevSeq,
                                            {
                                                type: 'Multiplier',
                                                min: node.min + 1,
                                                max: node.max !== 0 ? node.max + 1 : node.max,
                                                comma: true,
                                                term: seq
                                            }
                                        );

                                        // restore
                                        parent.terms.splice(start, 1, ...prevSeq.terms);
                                        return;
                                    }
                                } else {
                                    // comma at the end
                                    // [<seq> , ]<multiplier> <seq> -> <seq>#<multiplier + 1>
                                    const pos = parent.terms.indexOf(node);
                                    const end = pos + node.term.terms.length;
                                    const seq = {
                                        type: 'Group',
                                        terms: node.term.terms.slice(0, -1),
                                        combinator: node.term.combinator,
                                        explicit: false,
                                        disallowEmpty: false
                                    };
                                    const nextSeq = {
                                        type: 'Group',
                                        terms: parent.terms.slice(pos + 1, end),
                                        combinator: parent.combinator,
                                        explicit: false,
                                        disallowEmpty: false
                                    };

                                    if (generate(seq) === generate(nextSeq)) {
                                        // group a terms for a while
                                        nextSeq.terms = parent.terms.splice(pos, end, nextSeq);

                                        makeSuggestion(
                                            'A sequence can be rolled up',
                                            nextSeq,
                                            {
                                                type: 'Multiplier',
                                                min: node.min + 1,
                                                max: node.max !== 0 ? node.max + 1 : node.max,
                                                comma: true,
                                                term: seq
                                            }
                                        );

                                        // restore
                                        parent.terms.splice(pos, 1, ...nextSeq.terms);
                                        return;
                                    }
                                }
                            }

                            if (node.min === 0 && node.max === 1 && node.term.terms.length === 2) {
                                // [, <term> ]? -> , term?
                                // [ <term> ,]? -> term? ,
                                // (we believe that a group with only two comma is never exist)
                                makeSuggestion(
                                    'A group can be omitted and a multiplier moved to a non-comma term',
                                    node,
                                    Object.assign({}, node.term, {
                                        explicit: false,
                                        terms: node.term.terms.map(term =>
                                            term.type === 'Comma'
                                                ? term
                                                : Object.assign({}, node, { term })
                                        )
                                    })
                                );
                            }
                        }
                    }
                }

                stack.push(node);
            },
            leave: function() {
                stack.pop();
            }
        });

        if (ast.type === 'Group' && !ast.disallowEmpty && ast.explicit) {
            makeSuggestion(
                'A top level group can be omitted',
                ast,
                Object.assign({}, ast, {
                    explicit: false
                })
            );
        }
    } catch (e) {
        console.error('### ERROR', section, name, '\n' + e);
        console.log(e);
    }
});

// filter csstree syntaxes
suggestions = suggestions.filter(s => !/csstree/.test(s.section));

const stat = suggestions.reduce((result, suggestion) => {
    result[suggestion.message] = (result[suggestion.message] || 0) + 1;
    return result;
}, {});

console.log(suggestions.map(suggestion => suggestion.details).join('\n'));
console.log('');
console.log('Total suggestions:', suggestions.length);
Object.entries(stat)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
        console.log('  ' + String(count).padStart(3) + ' × ' + name);
    });

