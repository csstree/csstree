import iterateSyntaxes from './utils/iterate-syntaxes.js';
import { definitionSyntax } from '../lib/index.js';

const { parse, walk } = definitionSyntax;
const groupStat = {};

iterateSyntaxes(function(section, name, syntax) {
    try {
        const id = `${section} "${name}"`;
        const ast = parse(syntax);

        walk(ast, function(node) {
            if (node.type === 'Group') {
                const combinatorStat = groupStat[node.combinator] = groupStat[node.combinator] || {};
                const countStat = combinatorStat[node.terms.length] = combinatorStat[node.terms.length] || [];

                if (countStat.indexOf(id) === -1) {
                    countStat.push(id);
                }
            }
        });
    } catch (e) {
        console.error('### ERROR', section, name, '\n' + e);
    }
});

for (const combinator in groupStat) {
    const marker = (combinator === ' ' ? '_' : combinator).padEnd(2);
    console.log(marker, '==============');
    for (const count in groupStat[combinator]) {
        console.log(`${marker} ${count} terms (${groupStat[combinator][count].length} entries)`);
        console.log(groupStat[combinator][count].map(id => `${marker}      ${id}`).join('\n'));
    }
}
