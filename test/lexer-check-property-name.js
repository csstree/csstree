import assert from 'assert';
import importLib from './helpers/lib.js';

describe('Lexer#checkPropertyName()', async () => {
    const { lexer } = await importLib();

    it('should pass correct property', () => {
        assert.strictEqual(lexer.checkPropertyName('color'), undefined);
    });

    it('should pass correct vendor property', () => {
        assert.strictEqual(lexer.checkPropertyName('-webkit-color'), undefined); // FIXME: should fail because never exists
        assert.strictEqual(lexer.checkPropertyName('-webkit-border-radius'), undefined);
    });

    it('should fail on invalid property', () => {
        const error = lexer.checkPropertyName('foo');
        assert.strictEqual(error.name, 'SyntaxReferenceError');
        assert.strictEqual(error.message, 'Unknown property `foo`');
    });
});
