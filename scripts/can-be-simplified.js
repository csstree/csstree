const iterateSyntaxes = require('./utils/iterate-syntaxes');
const parse = require('../lib').grammar.parse;
const generate = require('../lib').grammar.generate;
const walk = require('../lib').grammar.walk;

iterateSyntaxes(function(section, name, syntax) {
    try {
        const id = `${section} "${name}"`;
        const ast = parse(syntax);
        const stack = [];

        walk(ast, {
            enter: function(node) {
                if (node.type === 'Group') {
                    if (node.terms.length === 1) {
                        const haveNoMultiplier = (!stack.length || stack[stack.length - 1].type !== 'Multiplier');
                        const termType = node.terms[0].type;
                        const termCanHaveMultiplier = termType === 'Keyword' || termType === 'Group' || termType === 'Type' || termType === 'Property';
                        const termHaveNoMultiplier = !haveNoMultiplier && termCanHaveMultiplier;

                        if (haveNoMultiplier || termHaveNoMultiplier) {
                            console.log([
                                `# ${id}`,
                                '# Redundant single term group',
                                '# Fragment: ' + generate(node),
                                '  ' + syntax,
                                ''
                            ].join('\n'));
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
            console.log([
                `# ${id}`,
                '# Redundant top level explicit group',
                '  ' + syntax,
                ''
            ].join('\n'));
        }
    } catch (e) {
        console.error('### ERROR', section, name, '\n' + e);
    }
});
