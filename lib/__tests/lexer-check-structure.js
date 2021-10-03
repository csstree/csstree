import assert from 'assert';
import { parse, lexer, fork } from 'css-tree';
import { forEachTest as forEachAstTest } from './fixture/ast.js';

describe('Lexer#checkStructure()', () => {
    describe('structure in AST node definition', () => {
        it('should fail when no structure field in node definition', () => {
            assert.throws(
                () => fork(prev => {
                    prev.node.Test = {};
                    return prev;
                }),
                /Missed `structure` field in `Test` node type definition/
            );
        });

        it('should fail on bad value in structure', () => {
            assert.throws(
                () => fork(prev => {
                    prev.node.Test = {
                        structure: {
                            foo: [123]
                        }
                    };
                    return prev;
                }),
                /Wrong value `123` in `Test\.foo` structure definition/
            );
        });
    });

    it('should pass correct structure', () => {
        const ast = parse('.foo { color: red }', { positions: true });
        const warns = lexer.checkStructure(ast);

        assert.strictEqual(warns, false);
    });

    it('should ignore properties from prototype', () => {
        const node = {
            type: 'Number',
            loc: null,
            value: '123'
        };

        Object.prototype.foo = 123;
        try {
            assert.strictEqual(lexer.checkStructure(node), false);
        } finally {
            delete Object.prototype.foo;
        }
    });

    describe('all parse test fixtures must have correct structure', () => {
        forEachAstTest((name, test) => {
            (test.skip ? it.skip : it)(name, () => {
                const ast = parse(test.source, test.options);

                // structure should be correct
                assert.strictEqual(lexer.checkStructure(ast), false);
            });
        });
    });

    describe('errors', () => {
        it('node should be an object', () => {
            const node = [];
            node.type = 'Number';

            assert.deepStrictEqual(lexer.checkStructure(node), [
                { node, message: 'Type of node should be an Object' }
            ]);
        });

        it('missed fields', () => {
            const node = {
                type: 'Foo'
            };

            assert.deepStrictEqual(lexer.checkStructure(node), [
                { node, message: 'Unknown node type `Foo`' }
            ]);
        });

        it('missed field', () => {
            const node = {
                type: 'Dimension',
                value: '123'
            };

            assert.deepStrictEqual(lexer.checkStructure(node), [
                { node, message: 'Field `Dimension.loc` is missed' },
                { node, message: 'Field `Dimension.unit` is missed' }
            ]);
        });

        it('unknown field', () => {
            const node = {
                type: 'Number',
                loc: null,
                value: '123',
                foo: 1
            };

            assert.deepStrictEqual(lexer.checkStructure(node), [
                { node, message: 'Unknown field `foo` for Number node type' }
            ]);
        });

        describe('bad value', () => {
            it('bad data type', () => {
                const node = {
                    type: 'Number',
                    loc: null,
                    value: 123
                };

                assert.deepStrictEqual(lexer.checkStructure(node), [
                    { node, message: 'Bad value for `Number.value`' }
                ]);
            });

            it('bad loc', () => {
                const node = {
                    type: 'Number',
                    loc: {},
                    value: '123'
                };

                assert.deepStrictEqual(lexer.checkStructure(node), [
                    { node, message: 'Bad value for `Number.loc.source`' }
                ]);
            });

            it('bad loc #2', () => {
                const node = {
                    type: 'Number',
                    loc: {
                        source: '-',
                        start: { line: 1, column: 1 },
                        end: { line: 1, column: 1, offset: 0 }
                    },
                    value: '123'
                };

                assert.deepStrictEqual(lexer.checkStructure(node), [
                    { node, message: 'Bad value for `Number.loc.start`' }
                ]);
            });

            it('bad loc #3', () => {
                const node = {
                    type: 'Number',
                    loc: {
                        source: '-',
                        start: { line: 1, column: 1, offset: 0 },
                        end: { line: 1, column: 1 }
                    },
                    value: '123'
                };

                assert.deepStrictEqual(lexer.checkStructure(node), [
                    { node, message: 'Bad value for `Number.loc.end`' }
                ]);
            });
        });
    });
});
