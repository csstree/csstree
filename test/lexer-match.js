const assert = require('assert');
const { parse, fork } = require('./helpers/lib');

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
        assert.equal(match.error, null);
    });

    it('should take a string as a value', () => {
        const syntax = customSyntax.lexer.getType('fn');
        const match = customSyntax.lexer.match(syntax, 'fn(1, 2, 3)');

        assert(match.matched);
        assert.equal(match.error, null);
    });

    it('should take a string as a syntax', () => {
        const match = customSyntax.lexer.match('fn( <number># )', 'fn(1, 2, 3)');

        assert(match.matched);
        assert.equal(match.error, null);
    });

    it('should fails on bad syntax', () => {
        const value = parse('fn(1, 2, 3)', { context: 'value' });
        const fn = value.children.first;
        const match = customSyntax.lexer.match({}, fn);

        assert.equal(match.matched, null);
        assert.equal(match.error.message, 'Bad syntax');
    });

    describe('mismatch position', () => {
        const customSyntax = fork(prev => ({
            ...prev,
            types: {
                'foo()': 'foo( <number>#{3} )',
                'bar': 'bar( <angle> )',
                'baz()': 'baz( <angle> | <number> )'
            }
        }));

        const tests = [
            { syntax: '<foo()>', value: 'foo(1, 2px, 3)', offset: 7 },
            { syntax: '<foo()>', value: 'foo(1, 2, 3, 4)', offset: 11 },
            { syntax: '<foo()>', value: 'foo(1, 211px)', offset: 7 },
            { syntax: '<foo()>', value: 'foo(1, 2 3)', offset: 9 },
            { syntax: '<foo()>', value: 'foo(1, 2)', offset: 8 },
            { syntax: '<bar>', value: 'bar( foo )', offset: 5 },
            { syntax: '<baz()>', value: 'baz( foo )', offset: 5 },
            { syntax: '<baz()>', value: 'baz( 1px )', offset: 5 },
            { syntax: '<number>{4}', value: '1 2 3', offset: 5 },
            { syntax: '<number>#{4}', value: '1, 2, 3', offset: 7 },
            { syntax: '<number>#{4}', value: '1, 2, 3,', offset: 8 },
            { syntax: '<number>#{4}', value: '1, 2, 3, 4,', offset: 10 }
        ];

        for (const { syntax, value, offset } of tests) {
            it(`${syntax} -> ${value}`, () => {
                const { error, matched } = customSyntax.lexer.match(syntax, value);

                assert.equal(matched, null);
                assert.notStrictEqual(error, null);
                assert.equal(error.mismatchOffset, offset);
                assert.equal(error.message, `Mismatch\n  syntax: ${
                    syntax
                }\n   value: ${
                    value
                }\n  --------${'-'.repeat(error.mismatchOffset)}^`);
            });
        }
    });
});
