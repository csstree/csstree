import assert from 'assert';
import { parse, lexer, fork } from 'css-tree';
import { lazyValues, cssWideKeywords } from './helpers/index.js';
import { forEachTest } from './fixture/definition-syntax.js';

const lazy = lazyValues({
    bar: () => parse('bar', { context: 'value' }),
    qux: () => parse('qux', { context: 'value' }),
    customSyntax: () => fork({
        properties: {
            foo: 'bar',
            '-baz-foo': 'qux'
        }
    }),
    customCssWideKeywords: () => fork({
        cssWideKeywords: ['test']
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
            const match = lazy.customSyntax.lexer.matchProperty('-vendor-foo', lazy.bar);

            assert(match.matched);
            assert.strictEqual(match.error, null);
        });

        it('hacks', () => {
            const match = lazy.customSyntax.lexer.matchProperty('_foo', lazy.bar);

            assert(match.matched);
            assert.strictEqual(match.error, null);
        });

        it('vendor prefix and hack', () => {
            const match = lazy.customSyntax.lexer.matchProperty('_-vendor-foo', lazy.bar);

            assert(match.matched);
            assert.strictEqual(match.error, null);
        });

        it('case insensetive with vendor prefix and hack', () => {
            let match;

            match = lazy.customSyntax.lexer.matchProperty('FOO', lazy.bar);
            assert(match.matched);
            assert.strictEqual(match.error, null);

            match = lazy.customSyntax.lexer.matchProperty('-VENDOR-Foo', lazy.bar);
            assert(match.matched);
            assert.strictEqual(match.error, null);

            match = lazy.customSyntax.lexer.matchProperty('_FOO', lazy.bar);
            assert(match.matched);
            assert.strictEqual(match.error, null);

            match = lazy.customSyntax.lexer.matchProperty('_-VENDOR-Foo', lazy.bar);
            assert(match.matched);
            assert.strictEqual(match.error, null);
        });

        it('should use verdor version first', () => {
            let match;

            match = lazy.customSyntax.lexer.matchProperty('-baz-foo', lazy.qux);
            assert(match.matched);
            assert.strictEqual(match.error, null);

            match = lazy.customSyntax.lexer.matchProperty('-baz-baz-foo', lazy.qux);
            assert.strictEqual(match.matched, null);
            assert.strictEqual(match.error.message, 'Unknown property `-baz-baz-foo`');
        });
    });

    it('custom property', () => {
        const match = lexer.matchProperty('--foo', lazy.bar);

        assert.strictEqual(match.matched, null);
        assert.strictEqual(match.error.message, 'Lexer matching doesn\'t applicable for custom properties');
    });

    describe('should match css wide keywords', function() {
        for (const keyword of cssWideKeywords) {
            const match = lexer.matchProperty('color', keyword);

            assert(match.matched);
            assert.strictEqual(match.error, null);
        }
    });

    it('should match css wide keywords', function() {
        for (const keyword of cssWideKeywords.concat('test')) {
            const match = lazy.customCssWideKeywords.lexer.matchProperty('color', keyword);

            assert(match.matched, keyword);
            assert.strictEqual(match.error, null, keyword);
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
