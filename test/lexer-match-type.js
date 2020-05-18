const assert = require('assert');
const { lazyValues } = require('./helpers');
const { parse, fork } = require('./helpers/lib');
const values = lazyValues({
    singleNumber: () => parse('1', { context: 'value' }),
    severalNumbers: () => parse('1, 2, 3', { context: 'value' }),
    cssWideKeyword: () => parse('inherit', { context: 'value' }),
    customSyntax: () => fork(prev => ({
        ...prev,
        types: {
            foo: '<bar>#',
            bar: '[ 1 | 2 | 3 ]'
        }
    }))
});

describe('Lexer#matchType()', () => {
    it('should match type', () => {
        const match = values.customSyntax.lexer.matchType('bar', values.singleNumber);

        assert(match.matched);
        assert.equal(match.error, null);
    });

    it('should match type using nested', () => {
        const match = values.customSyntax.lexer.matchType('foo', values.severalNumbers);

        assert(match.matched);
        assert.equal(match.error, null);
    });

    it('should fail on matching wrong value', () => {
        const match = values.customSyntax.lexer.matchType('bar', values.severalNumbers);

        assert.equal(match.matched, null);
        assert.equal(match.error.rawMessage, 'Mismatch');
    });

    it('should return null and save error for unknown type', () => {
        const match = values.customSyntax.lexer.matchType('baz', values.singleNumber);

        assert.equal(match.matched, null);
        assert.equal(match.error.message, 'Unknown type `baz`');
    });

    it('should not match to CSS wide names', () => {
        const match = values.customSyntax.lexer.matchType('foo', values.cssWideKeyword);

        assert.equal(match.matched, null);
        assert.equal(match.error.message, 'Mismatch\n  syntax: <bar>#\n   value: inherit\n  --------^');
    });
});
