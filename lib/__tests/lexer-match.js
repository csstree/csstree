import assert from 'assert';
import { parse, generate, fork } from 'css-tree';

describe('Lexer#match()', () => {
    const customSyntax = fork(prev => ({
        ...prev,
        types: {
            foo: '<bar>#',
            bar: '[ 1 | 2 | 3 ]',
            fn: 'fn(<foo>)'
        }
    }));

    it('should match by type', () => {
        const value = parse('fn(1, 2, 3)', { context: 'value' });
        const fn = value.children.first;
        const syntax = customSyntax.lexer.getType('fn');
        const match = customSyntax.lexer.match(syntax, fn);

        assert(match.matched);
        assert.strictEqual(match.error, null);
    });

    it('should take a string as a value', () => {
        const syntax = customSyntax.lexer.getType('fn');
        const match = customSyntax.lexer.match(syntax, 'fn(1, 2, 3)');

        assert(match.matched);
        assert.strictEqual(match.error, null);
    });

    it('should take a string as a syntax', () => {
        const match = customSyntax.lexer.match('fn( <number># )', 'fn(1, 2, 3)');

        assert(match.matched);
        assert.strictEqual(match.error, null);
    });

    it('should fails on bad syntax', () => {
        const value = parse('fn(1, 2, 3)', { context: 'value' });
        const fn = value.children.first;
        const match = customSyntax.lexer.match({}, fn);

        assert.strictEqual(match.matched, null);
        assert.strictEqual(match.error.message, 'Bad syntax');
    });

    describe('mismatch position', () => {
        const customSyntax = fork(prev => ({
            ...prev,
            types: {
                'foo()': 'foo( <number>#{3} )',
                'bar': 'bar( <angle> )',
                'baz()': 'baz( <angle> | <number> )',
                'rgb': 'red | green | blue'
            }
        }));

        const tests = [
            { syntax: '<foo()>', value: 'foo(1, 2px, 3)', start: 7, end: 10 },
            { syntax: '<foo()>', value: 'foo(1, 2, 3, 4)', start: 11, end: 12 },
            { syntax: '<foo()>', value: 'foo(1, 211px)', start: 7, end: 12 },
            { syntax: '<foo()>', value: 'foo(1, 2 3)', start: 9, end: 10 },
            { syntax: '<foo()>', value: 'foo(1, 2)', start: 8, end: 9, astStart: 9 }, // in this case AST match can't answer with correct location
            { syntax: '<bar>', value: 'bar( foo )', start: 5, end: 8 },
            { syntax: '<baz()>', value: 'baz( foo )', start: 5, end: 8 },
            { syntax: '<baz()>', value: 'baz( 1px )', start: 5, end: 8 },
            { syntax: '<number>{4}', value: '1 2 3', start: 5, end: 5 },
            { syntax: '<number>#{4}', value: '1, 2, 3', start: 7, end: 7 },
            { syntax: '<number>#{4}', value: '1, 2, 3,', start: 8, end: 8 },
            { syntax: '<number>#{4}', value: '1, 2, 3, 4,', start: 10, end: 11 },
            { syntax: '<rgb>+', value: 'yellow', start: 0, end: 6 },
            { syntax: '<rgb>+', value: 'yellow red', start: 0, end: 6 },
            { syntax: '<rgb>+', value: 'red yellow', start: 4, end: 10 },
            { syntax: '<rgb>+', value: 'red yellow green', start: 4, end: 10 }
        ];
        const values = [
            ['string', String, String],
            ['ast', value => parse(value, { context: 'value', positions: true }), ast => generate(ast)],
            ['ast Raw', value => ({
                type: 'Raw',
                value,
                loc: {
                    start: { line: 1, column: 1, offset: 0 },
                    end: { line: 1, column: value.length + 1, offset: value.length }
                }
            }), ast => generate(ast)]
        ];

        for (const [type, parse, serialize] of values) {
            describe(type + ' value', () => {
                for (const { syntax, value, start, end, astStart, astEnd } of tests) {
                    it(`${syntax} -> ${value}`, () => {
                        const testValue = parse(value);
                        const { error, matched } = customSyntax.lexer.match(syntax, testValue);

                        assert.strictEqual(matched, null);
                        assert.notStrictEqual(error, null);
                        assert.strictEqual(error.offset, error.loc.start.offset, 'offset shoud be the same as loc.start.offset');
                        assert.strictEqual(error.loc.start.offset, type === 'ast' && astStart !== undefined ? astStart : start, 'loc.start');
                        assert.strictEqual(error.loc.end.offset, type === 'ast' && astEnd !== undefined ? astEnd : end, 'loc.end');
                        assert.strictEqual(error.message, `Mismatch\n  syntax: ${
                            syntax
                        }\n   value: ${
                            serialize(testValue)
                        }\n  --------${'-'.repeat(error.mismatchOffset)}^`);
                    });
                }
            });
        }
    });
});
