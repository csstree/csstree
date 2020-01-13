const assert = require('assert');
const path = require('path');
const { parse, walk } = require('./helpers/lib');
const notInsideAtrulePrelude = stack => stack.every(node => node.type !== 'AtrulePrelude');
const { tests, forEachTest: forEachParseTest } = require('./fixture/parse');
const testWithRules = Object.keys(tests)
    .map(function(filename) {
        const dir = path.basename(path.dirname(filename));
        if (dir === 'atrule' || dir === 'rule' || dir === 'stylesheet') {
            return tests[filename];
        };
    })
    .filter(Boolean);

function expectedWalk(ast, enter, leave, checker = Boolean) {
    function walk(node) {
        if (enter && checker(stack, node)) {
            result.push(node.type);
        }

        stack.push(node);
        for (const value of Object.values(node)) {
            if (Array.isArray(value)) {
                value.forEach(walk);
            } else if (value && typeof value === 'object') {
                walk(value);
            }
        }
        stack.pop();

        if (leave && checker(stack, node)) {
            result.push(node.type);
        }
    }

    const result = [];
    const stack = [];

    walk(ast);

    return result;
}

function createWalkTest(name, test, context, walker, enter, leave) {
    (test.skip ? it.skip : it)(name, () => {
        const actual = [];
        const ast = parse(test.source, test.options);

        walker(ast, node => actual.push(node.type));

        // type arrays should be equal
        assert.deepEqual(
            actual,
            expectedWalk(test.ast, enter, leave)
        );
    });
}

function createWalkVisitTest(test, visitType, walker) {
    (test.skip ? it.skip : it)(test.name, () => {
        const actual = [];
        const ast = parse(test.source, test.options);

        walker(ast, node => actual.push(node.type));

        // type arrays should be equal
        assert.deepEqual(
            actual.sort(),
            expectedWalk(test.ast, true, false)
                .filter(type => type === visitType)
                .sort()
        );
    });
}

function createWalkDeclarationsTest(test, context, walker) {
    (test.skip ? it.skip : it)(test.name, () => {
        const actual = [];
        const ast = parse(test.source, test.options);

        walker(ast, node => actual.push(node.type));

        // type arrays should be equal
        assert.deepEqual(
            actual.sort(),
            expectedWalk(test.ast, false, true, notInsideAtrulePrelude)
                .filter(type => type === 'Declaration')
                .sort()
        );
    });
}

describe('AST traversal', () => {
    it('base test', () => {
        const ast = parse('@import url("test");@media (min-width: 200px) { .foo:nth-child(2n) { color: rgb(100%, 10%, 0%); width: calc(3px + 5%) } }');
        const visitedTypes = new Set();
        const expected = [
            'AnPlusB',
            'Atrule',
            'AtrulePrelude',
            'Block',
            'ClassSelector',
            'Declaration',
            'Dimension',
            'Function',
            'MediaFeature',
            'MediaQuery',
            'MediaQueryList',
            'Nth',
            'Operator',
            'Percentage',
            'PseudoClassSelector',
            'Rule',
            'Selector',
            'SelectorList',
            'String',
            'StyleSheet',
            'Url',
            'Value',
            'WhiteSpace'
        ];

        walk(ast, node => visitedTypes.add(node.type));

        assert.deepEqual([...visitedTypes].sort(), expected);
    });

    it('base test #2', () => {
        const ast = parse('.a { color: red }');
        const log = [];

        walk(ast, {
            enter: node => log.push('enter ' + node.type),
            leave: node => log.push('leave ' + node.type)
        });

        assert.deepEqual(log, [
            'enter StyleSheet',
            'enter Rule',
            'enter SelectorList',
            'enter Selector',
            'enter ClassSelector',
            'leave ClassSelector',
            'leave Selector',
            'leave SelectorList',
            'enter Block',
            'enter Declaration',
            'enter Value',
            'enter Identifier',
            'leave Identifier',
            'leave Value',
            'leave Declaration',
            'leave Block',
            'leave Rule',
            'leave StyleSheet'
        ]);
    });

    describe('traverse order', () => {
        const ast = parse('.a.b { foo: bar; baz: qux } .c {} @media all { .d:not(.e) { aa: bb; cc: dd } f { ee: ff } }');
        const expectedOrder = 'a b foo bar baz qux c media all d not e aa bb cc dd f ee ff'.split(' ');

        it('natural', () => {
            const visitedNames = [];

            walk(ast, {
                enter: (node) => {
                    if (node.name || node.property) {
                        visitedNames.push(node.name || node.property);
                    }
                }
            });

            assert.deepEqual(
                visitedNames,
                expectedOrder
            );
        });

        it('reverse', () => {
            const visitedNames = [];

            walk(ast, {
                reverse: true,
                enter: (node) => {
                    if (node.name || node.property) {
                        visitedNames.push(node.name || node.property);
                    }
                }
            });

            assert.deepEqual(
                visitedNames,
                expectedOrder.slice().reverse()
            );
        });
    });

    describe('bad options', () => {
        const ast = parse('.foo { color: red }');

        it('should throws when no enter/leave handlers is set', () => {
            assert.throws(
                () => walk(ast),
                /Neither `enter` nor `leave` walker handler is set or both aren't a function/
            );

            assert.throws(
                () => walk(ast, {}),
                /Neither `enter` nor `leave` walker handler is set or both aren't a function/
            );
        });

        it('should throws when visit has wrong value', () => {
            assert.throws(
                () => walk(ast, { visit: 'Foo' }),
                /Bad value `Foo` for `visit` option \(should be: AnPlusB, Atrule, AtrulePrelude, AttributeSelector, Block, Brackets, CDC, CDO, ClassSelector, Combinator, Comment, Declaration, DeclarationList, Dimension, Function, HexColor, Identifier, IdSelector, MediaFeature, MediaQuery, MediaQueryList, Nth, Number, Operator, Parentheses, Percentage, PseudoClassSelector, PseudoElementSelector, Ratio, Raw, Rule, Selector, SelectorList, String, StyleSheet, TypeSelector, UnicodeRange, Url, Value, WhiteSpace\)/
            );
        });
    });

    describe('walk(ast, fn)', () => {
        forEachParseTest((name, test, context) =>
            createWalkTest(name, test, context, walk, true, false)
        );
    });

    describe('walk(ast, { leave: fn })', () => {
        forEachParseTest((name, test, context) =>
            createWalkTest(name, test, context, function(ast, fn) {
                walk(ast, { leave: fn });
            }, false, true)
        );
    });

    describe('walk(ast, { visit: \'Rule\' })', () => {
        testWithRules.forEach(file =>
            Object.keys(file.tests).forEach(name =>
                createWalkVisitTest(file.tests[name], 'Rule', (ast, fn) =>
                    walk(ast, {
                        visit: 'Rule',
                        enter: fn
                    })
                )
            )
        );
    });

    describe('walk(ast, { visit: \'Atrule\' })', () => {
        testWithRules.forEach(file =>
            Object.keys(file.tests).forEach(name =>
                createWalkVisitTest(file.tests[name], 'Atrule', (ast, fn) =>
                    walk(ast, {
                        visit: 'Atrule',
                        enter: fn
                    })
                )
            )
        );
    });

    describe('walk(ast, { visit: \'Rule\', reverse: true })', () => {
        testWithRules.forEach(file =>
            Object.keys(file.tests).forEach(name =>
                createWalkVisitTest(file.tests[name], 'Rule', (ast, fn) =>
                    walk(ast, {
                        visit: 'Rule',
                        reverse: true,
                        enter: fn
                    })
                )
            )
        );
    });

    describe('walk(ast, { visit: \'Number\' })', () => {
        testWithRules.forEach(file =>
            Object.keys(file.tests).forEach(name =>
                createWalkVisitTest(file.tests[name], 'Number', (ast, fn) =>
                    walk(ast, {
                        visit: 'Number',
                        enter: fn
                    })
                )
            )
        );
    });

    describe('walk(ast, { visit: \'Declaration\' })', () => {
        testWithRules.forEach(file =>
            Object.keys(file.tests).forEach(name =>
                createWalkDeclarationsTest(file.tests[name], 'Declaration', (ast, fn) =>
                    walk(ast, {
                        visit: 'Declaration',
                        enter: fn
                    })
                )
            )
        );

        it('iterate DeclarationList', () => {
            const ast = parse('foo: a; bar: b', { context: 'declarationList' });
            let visited = 0;

            walk(ast, {
                visit: 'Declaration',
                enter(node) {
                    if (node.type === 'Declaration') {
                        visited++;
                    }
                }
            });

            assert.equal(visited, 2);
        });
    });
});
