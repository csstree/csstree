import assert from 'assert';
import path from 'path';
import { lazyValues } from './helpers/index.js';
import { parse, walk } from 'css-tree';
import { tests, forEachTest as forEachAstTest } from './fixture/ast.js';

const notInsideAtrulePrelude = stack => stack.every(node => node.type !== 'AtrulePrelude');
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
        assert.deepStrictEqual(
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
        assert.deepStrictEqual(
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
        assert.deepStrictEqual(
            actual.sort(),
            expectedWalk(test.ast, false, true, notInsideAtrulePrelude)
                .filter(type => type === 'Declaration')
                .sort()
        );
    });
}

describe('AST traversal', () => {
    it('base test', () => {
        const ast = parse('@import url("test");@media (min-width: 200px) { .foo:nth-child(2n) { color: rgb(100%, 10%, 0%); width: calc(3px + 5%); content: "test" } }');
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
            'Value'
        ];

        walk(ast, node => visitedTypes.add(node.type));

        assert.deepStrictEqual([...visitedTypes].sort(), expected);
    });

    it('base test #2', () => {
        const ast = parse('.a { color: red }');
        const log = [];

        walk(ast, {
            enter: node => log.push('enter ' + node.type),
            leave: node => log.push('leave ' + node.type)
        });

        assert.deepStrictEqual(log, [
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
        const values = lazyValues({
            ast: () => parse('.a.b { foo: bar; baz: qux } .c {} @media all { .d:not(.e > .f) { aa: bb; cc: dd ee } f { ff: gg } }')
        });

        it('natural', () => {
            const visitedNames = [];
            const expected = 'a b foo bar baz qux c media all d not e > f aa bb cc dd ee f ff gg'.split(' ');

            walk(values.ast, {
                enter(node) {
                    if (node.name || node.property) {
                        visitedNames.push(node.name || node.property);
                    }
                }
            });

            assert.deepStrictEqual(
                visitedNames,
                expected
            );
        });

        it('reverse', () => {
            const visitedNames = [];
            const expected = 'media ff gg f cc ee dd aa bb not f > e d all c baz qux foo bar b a'.split(' ');

            walk(values.ast, {
                reverse: true,
                enter(node) {
                    if (node.name || node.property) {
                        visitedNames.push(node.name || node.property);
                    }
                }
            });

            assert.deepStrictEqual(
                visitedNames,
                expected
            );
        });
    });

    describe('break traverse', () => {
        const ast = parse('.a.b { foo: bar; } .c {} .a.b { foo: bar; }');
        const nodeName = (node) =>
            node.type + (node.name || node.property ? ':' + (node.name || node.property) : '');

        describe('natural order', () => {
            const expected = [
                'enter StyleSheet',
                'enter Rule',
                'enter SelectorList',
                'enter Selector',
                'enter ClassSelector:a',
                'leave ClassSelector:a',
                'enter ClassSelector:b',
                'leave ClassSelector:b',
                'leave Selector',
                'leave SelectorList',
                'enter Block',
                'enter Declaration:foo',
                'enter Value',
                'enter Identifier:bar',
                'leave Identifier:bar',
                'leave Value',
                'leave Declaration:foo',
                'leave Block',
                'leave Rule',
                'enter Rule',
                'enter SelectorList',
                'enter Selector',
                'enter ClassSelector:c'
            ];

            it('this.break', () => {
                const actual = [];

                walk(ast, {
                    enter(node) {
                        actual.push('enter ' + nodeName(node));

                        if (node.name === 'c') {
                            return this.break;
                        }
                    },
                    leave(node) {
                        actual.push('leave ' + nodeName(node));
                    }
                });

                assert.deepStrictEqual(
                    actual,
                    expected
                );
            });

            it('walk.break', () => {
                const actual = [];

                walk(ast, {
                    enter: (node) => {
                        actual.push('enter ' + nodeName(node));

                        if (node.name === 'c') {
                            return walk.break;
                        }
                    },
                    leave(node) {
                        actual.push('leave ' + nodeName(node));
                    }
                });

                assert.deepStrictEqual(
                    actual,
                    expected
                );
            });
        });

        describe('reverse order', () => {
            const expected = [
                'enter StyleSheet',
                'enter Rule',
                'enter Block',
                'enter Declaration:foo',
                'enter Value',
                'enter Identifier:bar',
                'leave Identifier:bar',
                'leave Value',
                'leave Declaration:foo',
                'leave Block',
                'enter SelectorList',
                'enter Selector',
                'enter ClassSelector:b',
                'leave ClassSelector:b',
                'enter ClassSelector:a',
                'leave ClassSelector:a',
                'leave Selector',
                'leave SelectorList',
                'leave Rule',
                'enter Rule',
                'enter Block',
                'leave Block',
                'enter SelectorList',
                'enter Selector',
                'enter ClassSelector:c'
            ];

            it('this.break', () => {
                const actual = [];

                walk(ast, {
                    reverse: true,
                    enter(node) {
                        actual.push('enter ' + nodeName(node));

                        if (node.name === 'c') {
                            return this.break;
                        }
                    },
                    leave(node) {
                        actual.push('leave ' + nodeName(node));
                    }
                });

                assert.deepStrictEqual(
                    actual,
                    expected
                );
            });

            it('walk.break', () => {
                const actual = [];

                walk(ast, {
                    reverse: true,
                    enter: (node) => {
                        actual.push('enter ' + nodeName(node));

                        if (node.name === 'c') {
                            return walk.break;
                        }
                    },
                    leave(node) {
                        actual.push('leave ' + nodeName(node));
                    }
                });

                assert.deepStrictEqual(
                    actual,
                    expected
                );
            });
        });
    });

    describe('skip node traverse', () => {
        const ast = parse('.a.b { foo: bar } @media all { selector { foo: bar } } .c.d { foo: bar }');
        const nodeName = node =>
            node.type + (node.name || node.property ? ':' + (node.name || node.property) : '');

        describe('natural order', () => {
            const expected = [
                'enter StyleSheet',
                'enter Rule',
                'enter SelectorList',
                'enter Selector',
                'enter ClassSelector:a',
                'leave ClassSelector:a',
                'enter ClassSelector:b',
                'leave ClassSelector:b',
                'leave Selector',
                'leave SelectorList',
                'enter Block',
                'enter Declaration:foo',
                'enter Value',
                'enter Identifier:bar',
                'leave Identifier:bar',
                'leave Value',
                'leave Declaration:foo',
                'leave Block',
                'leave Rule',
                'skip Atrule:media',
                'enter Rule',
                'enter SelectorList',
                'enter Selector',
                'enter ClassSelector:c',
                'leave ClassSelector:c',
                'enter ClassSelector:d',
                'leave ClassSelector:d',
                'leave Selector',
                'leave SelectorList',
                'enter Block',
                'enter Declaration:foo',
                'enter Value',
                'enter Identifier:bar',
                'leave Identifier:bar',
                'leave Value',
                'leave Declaration:foo',
                'leave Block',
                'leave Rule',
                'leave StyleSheet'
            ];

            it('this.skip', () => {
                const actual = [];

                walk(ast, {
                    enter(node) {
                        if (node.name === 'media') {
                            actual.push('skip ' + nodeName(node));
                            return this.skip;
                        }

                        actual.push('enter ' + nodeName(node));
                    },
                    leave(node) {
                        actual.push('leave ' + nodeName(node));
                    }
                });

                assert.deepStrictEqual(
                    actual,
                    expected
                );
            });

            it('walk.skip', () => {
                const actual = [];

                walk(ast, {
                    enter: (node) => {
                        if (node.name === 'media') {
                            actual.push('skip ' + nodeName(node));
                            return walk.skip;
                        }

                        actual.push('enter ' + nodeName(node));
                    },
                    leave(node) {
                        actual.push('leave ' + nodeName(node));
                    }
                });

                assert.deepStrictEqual(
                    actual,
                    expected
                );
            });
        });

        describe('reverse order', () => {
            const expected = [
                'enter StyleSheet',
                'enter Rule',
                'enter Block',
                'enter Declaration:foo',
                'enter Value',
                'enter Identifier:bar',
                'leave Identifier:bar',
                'leave Value',
                'leave Declaration:foo',
                'leave Block',
                'enter SelectorList',
                'enter Selector',
                'enter ClassSelector:d',
                'leave ClassSelector:d',
                'enter ClassSelector:c',
                'leave ClassSelector:c',
                'leave Selector',
                'leave SelectorList',
                'leave Rule',
                'skip Atrule:media',
                'enter Rule',
                'enter Block',
                'enter Declaration:foo',
                'enter Value',
                'enter Identifier:bar',
                'leave Identifier:bar',
                'leave Value',
                'leave Declaration:foo',
                'leave Block',
                'enter SelectorList',
                'enter Selector',
                'enter ClassSelector:b',
                'leave ClassSelector:b',
                'enter ClassSelector:a',
                'leave ClassSelector:a',
                'leave Selector',
                'leave SelectorList',
                'leave Rule',
                'leave StyleSheet'
            ];

            it('this.skip', () => {
                const actual = [];

                walk(ast, {
                    reverse: true,
                    enter(node) {
                        if (node.name === 'media') {
                            actual.push('skip ' + nodeName(node));
                            return this.skip;
                        }

                        actual.push('enter ' + nodeName(node));
                    },
                    leave(node) {
                        actual.push('leave ' + nodeName(node));
                    }
                });

                assert.deepStrictEqual(
                    actual,
                    expected
                );
            });

            it('walk.skip', () => {
                const actual = [];

                walk(ast, {
                    reverse: true,
                    enter: (node) => {
                        if (node.name === 'media') {
                            actual.push('skip ' + nodeName(node));
                            return walk.skip;
                        }

                        actual.push('enter ' + nodeName(node));
                    },
                    leave(node) {
                        actual.push('leave ' + nodeName(node));
                    }
                });

                assert.deepStrictEqual(
                    actual,
                    expected
                );
            });
        });
    });


    describe('bad options', () => {
        const ast = {};

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
                /Bad value `Foo` for `visit` option \(should be: AnPlusB, Atrule, AtrulePrelude, AttributeSelector, Block, Brackets, CDC, CDO, ClassSelector, Combinator, Comment, Declaration, DeclarationList, Dimension, Function, Hash, IdSelector, Identifier, MediaFeature, MediaQuery, MediaQueryList, NestingSelector, Nth, Number, Operator, Parentheses, Percentage, PseudoClassSelector, PseudoElementSelector, Ratio, Raw, Rule, Selector, SelectorList, String, StyleSheet, TypeSelector, UnicodeRange, Url, Value, WhiteSpace\)/
            );
        });
    });

    describe('walk(ast, fn)', () => {
        forEachAstTest((name, test, context) =>
            createWalkTest(name, test, context, walk, true, false)
        );
    });

    describe('walk(ast, { leave: fn })', () => {
        forEachAstTest((name, test, context) =>
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

            assert.strictEqual(visited, 2);
        });
    });
});
