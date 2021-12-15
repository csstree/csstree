import iterateSyntaxes from './utils/iterate-syntaxes.js';
import { definitionSyntax } from '../lib/index.js';

const { parse, walk } = definitionSyntax;
const collected = {
    Function: new Set(),
    String: new Set()
};

iterateSyntaxes(function(section, name, syntax) {
    const id = `${section} "${name}"`;

    try {
        const ast = parse(syntax);

        walk(ast, function(node) {
            switch (node.type) {
                case 'Function':
                    collected.Function.add(node.name + '()');
                    break;
                case 'String':
                    collected.String.add(node.value);
                    break;
            }
        });

        // const stack = [];
        // walk(ast, {
        //     enter: function(node) {
        //         if (node.type === 'Function') {
        //             const parent = stack[stack.length - 1];
        //             const start = parent.terms.indexOf(node);

        //             for (let i = start; i < parent.terms.length; i++) {
        //                 if (parent.terms[i].type === 'Token' && parent.terms[i].value === ')') {
        //                     i++;
        //                     break;
        //                 }
        //             }

        //             const functionSequence = {
        //                 type: 'Group',
        //                 terms: parent.terms.slice(start, i),
        //                 combinator: ' ',
        //                 explicit: false,
        //                 disallowEmpty: false
        //             };
        //         }
        //         stack.push(node);
        //     },
        //     leave: function() {
        //         stack.pop();
        //     }
        // });
    } catch (e) {
        console.error(id, e);
    }
});

for (const type in collected) {
    console.log(type);
    console.log(JSON.stringify([...collected[type]].sort(), null, 4));
}
