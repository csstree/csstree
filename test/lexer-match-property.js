const assert = require('assert');
const { parse, lexer, fork } = require('./helpers/lib');
const { lazyValues } = require('./helpers');
const fixture = require('./fixture/syntax');
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
            assert.equal(match.error, null);
        });

        it('hacks', () => {
            const match = values.customSyntax.lexer.matchProperty('_foo', values.bar);

            assert(match.matched);
            assert.equal(values.customSyntax.lexer.lastMatchError, null);
        });

        it('vendor prefix and hack', () => {
            const match = values.customSyntax.lexer.matchProperty('_-vendor-foo', values.bar);

            assert(match.matched);
            assert.equal(values.customSyntax.lexer.lastMatchError, null);
        });

        it('case insensetive with vendor prefix and hack', () => {
            let match;

            match = values.customSyntax.lexer.matchProperty('FOO', values.bar);
            assert(match.matched);
            assert.equal(match.error, null);

            match = values.customSyntax.lexer.matchProperty('-VENDOR-Foo', values.bar);
            assert(match.matched);
            assert.equal(match.error, null);

            match = values.customSyntax.lexer.matchProperty('_FOO', values.bar);
            assert(match.matched);
            assert.equal(match.error, null);

            match = values.customSyntax.lexer.matchProperty('_-VENDOR-Foo', values.bar);
            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('should use verdor version first', () => {
            let match;

            match = values.customSyntax.lexer.matchProperty('-baz-foo', values.qux);
            assert(match.matched);
            assert.equal(match.error, null);

            match = values.customSyntax.lexer.matchProperty('-baz-baz-foo', values.qux);
            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'Unknown property `-baz-baz-foo`');
        });
    });

    it('custom property', () => {
        const match = lexer.matchProperty('--foo', values.bar);

        assert.equal(match.matched, null);
        assert.equal(match.error.message, 'Lexer matching doesn\'t applicable for custom properties');
    });

    it('should not be matched to empty value', () => {
        const match = lexer.matchProperty('color', parse('', { context: 'value', positions: true }));

        assert.equal(match.matched, null);
        assert.equal(match.error.rawMessage, 'Mismatch');
        assert.deepEqual({
            line: match.error.line,
            column: match.error.column
        }, {
            line: 1,
            column: 1
        });
    });

    fixture.forEachTest((testType, testState, name, lexer, property, value, syntax) => {
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

                    assert.equal(match.matched, null, 'should NOT MATCH to "' + value + '"');
                    assert.equal(match.error.name, 'SyntaxMatchError');
                });
                break;
        }
    });
});
