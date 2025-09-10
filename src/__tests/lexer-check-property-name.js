import assert from 'assert';
import { lexer } from 'css-tree';

describe('Lexer#checkPropertyName()', () => {
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
