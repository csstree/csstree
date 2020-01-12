const assert = require('assert');
const { parse, fork } = require('../lib');

describe('Lexer#matchType()', () => {
    const singleNumber = parse('1', { context: 'value' });
    const severalNumbers = parse('1, 2, 3', { context: 'value' });
    const cssWideKeyword = parse('inherit', { context: 'value' });
    const customSyntax = fork(prev => ({
        ...prev,
        types: {
            foo: '<bar>#',
            bar: '[ 1 | 2 | 3 ]'
        }
    }));

    it('should match type', () => {
        const match = customSyntax.lexer.matchType('bar', singleNumber);

        assert(match.matched);
        assert.equal(match.error, null);
    });

    it('should match type using nested', () => {
        const match = customSyntax.lexer.matchType('foo', severalNumbers);

        assert(match.matched);
        assert.equal(match.error, null);
    });

    it('should fail on matching wrong value', () => {
        const match = customSyntax.lexer.matchType('bar', severalNumbers);

        assert.equal(match.matched, null);
        assert.equal(match.error.rawMessage, 'Mismatch');
    });

    it('should return null and save error for unknown type', () => {
        const match = customSyntax.lexer.matchType('baz', singleNumber);

        assert.equal(match.matched, null);
        assert.equal(match.error.message, 'Unknown type `baz`');
    });

    it('should not match to CSS wide names', () => {
        const match = customSyntax.lexer.matchType('foo', cssWideKeyword);

        assert.equal(match.matched, null);
        assert.equal(match.error.message, 'Mismatch\n  syntax: <bar>#\n   value: inherit\n  --------^');
    });
});
