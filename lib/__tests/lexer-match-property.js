import assert from 'assert';
import { parse, lexer, fork } from 'css-tree';
import { lazyValues, cssWideKeywords } from './helpers/index.js';
import { forEachTest } from './fixture/definition-syntax.js';

const values = lazyValues({
    bar: () => parse('bar', { context: 'value' }),
    qux: () => parse('qux', { context: 'value' }),
    customSyntax: () => fork(function(prev, assign) {
        return assign(prev, {
            properties: {
                foo: 'bar',
                '-baz-foo': 'qux'
            }
        });
    })
});

function getMatch(lexer, property, value, syntax) {
    return syntax
        ? lexer.match(syntax, value)
        : lexer.matchProperty(property, value);
}

describe('Lexer#matchProperty()', () => {
    describe('vendor prefixes and hacks', () => {
        it('vendor prefix', () => {
            const match = values.customSyntax.lexer.matchProperty('-vendor-foo', values.bar);

            assert(match.matched);
            assert.strictEqual(match.error, null);
        });

        it('hacks', () => {
            const match = values.customSyntax.lexer.matchProperty('_foo', values.bar);

            assert(match.matched);
            assert.strictEqual(match.error, null);
        });

        it('vendor prefix and hack', () => {
            const match = values.customSyntax.lexer.matchProperty('_-vendor-foo', values.bar);

            assert(match.matched);
            assert.strictEqual(match.error, null);
        });

        it('case insensetive with vendor prefix and hack', () => {
            let match;

            match = values.customSyntax.lexer.matchProperty('FOO', values.bar);
            assert(match.matched);
            assert.strictEqual(match.error, null);

            match = values.customSyntax.lexer.matchProperty('-VENDOR-Foo', values.bar);
            assert(match.matched);
            assert.strictEqual(match.error, null);

            match = values.customSyntax.lexer.matchProperty('_FOO', values.bar);
            assert(match.matched);
            assert.strictEqual(match.error, null);

            match = values.customSyntax.lexer.matchProperty('_-VENDOR-Foo', values.bar);
            assert(match.matched);
            assert.strictEqual(match.error, null);
        });

        it('should use verdor version first', () => {
            let match;

            match = values.customSyntax.lexer.matchProperty('-baz-foo', values.qux);
            assert(match.matched);
            assert.strictEqual(match.error, null);

            match = values.customSyntax.lexer.matchProperty('-baz-baz-foo', values.qux);
            assert.strictEqual(match.matched, null);
            assert.strictEqual(match.error.message, 'Unknown property `-baz-baz-foo`');
        });
    });

    it('custom property', () => {
        const match = lexer.matchProperty('--foo', values.bar);

        assert.strictEqual(match.matched, null);
        assert.strictEqual(match.error.message, 'Lexer matching doesn\'t applicable for custom properties');
    });

    describe('should match css wide keywords', function() {
        for (const keyword of cssWideKeywords) {
            it(keyword, () => {
                const match = lexer.matchProperty('color', parse(keyword, { context: 'value' }));

                assert(match.matched);
                assert.strictEqual(match.error, null);
            });
        }
    });

    it('should not be matched to empty value', () => {
        const match = lexer.matchProperty('color', parse('', { context: 'value', positions: true }));

        assert.strictEqual(match.matched, null);
        assert.strictEqual(match.error.rawMessage, 'Mismatch');
        assert.deepStrictEqual({
            line: match.error.line,
            column: match.error.column
        }, {
            line: 1,
            column: 1
        });
    });

    forEachTest((testType, testState, name, lexer, property, value, syntax) => {
        switch (testType) {
            case 'valid':
                (it[testState] || it)(name, () => {
                    const match = getMatch(lexer, property, value, syntax);

                    // temporary solution to avoid var() using errors
                    if (match.error) {
                        if (
                            /Matching for a tree with var\(\) is not supported/.test(match.error.message) ||
                            /Lexer matching doesn't applicable for custom properties/.test(match.error.message)) {
                            assert(true);
                            return;
                        }
                    }

                    assert(match.matched !== null, match.error && match.error.message);
                });
                break;

            case 'invalid':
                (it[testState] || it)(name, function() {
                    const match = getMatch(lexer, property, value, syntax);

                    assert.strictEqual(match.matched, null, 'should NOT MATCH to "' + value + '"');
                    assert.strictEqual(match.error.name, 'SyntaxMatchError');
                });
                break;
        }
    });
});
