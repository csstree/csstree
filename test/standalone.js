const assert = require('assert');
const List = require('../lib/common/List');
const parse = require('../lib/parser');
const walk = require('../lib/walker');
const generate = require('../lib/generator');
const convertor = require('../lib/convertor');
const stringifyWithNoInfo = ast => JSON.stringify(ast, (key, value) => key !== 'loc' ? value : undefined, 4);

const css = '.a{}';
const expectedAst = {
    type: 'StyleSheet',
    children: [
        {
            type: 'Rule',
            prelude: {
                type: 'SelectorList',
                children: [
                    {
                        type: 'Selector',
                        children: [
                            {
                                type: 'ClassSelector',
                                name: 'a'
                            }
                        ]
                    }
                ]
            },
            block: {
                type: 'Block',
                children: []
            }
        }
    ]
};

describe('logical parts as standalone modules', () => {
    it('parser', () => {
        const ast = parse(css);
        assert.equal(stringifyWithNoInfo(ast), stringifyWithNoInfo(expectedAst));
    });

    it('generator', () => {
        assert.equal(generate(expectedAst), css);
    });

    it('walker', () => {
        const types = [];

        walk(expectedAst, node => types.push(node.type));

        assert.deepEqual(types, [
            'StyleSheet',
            'Rule',
            'SelectorList',
            'Selector',
            'ClassSelector',
            'Block'
        ]);
    });

    it('convertor', () => {
        const ast = parse(css);

        assert.equal(ast.children instanceof List, true);
        assert.equal(ast.children.first.prelude.children instanceof List, true);

        convertor.toPlainObject(ast);

        assert.equal(Array.isArray(ast.children), true);
        assert.equal(Array.isArray(ast.children[0].prelude.children), true);

        convertor.fromPlainObject(ast);

        assert.equal(ast.children instanceof List, true);
        assert.equal(ast.children.first.prelude.children instanceof List, true);
    });
});
