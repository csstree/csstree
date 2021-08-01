import assert from 'assert';
import importLib from './helpers/lib.js';

describe('Lexer#checkAtruleName()', async () => {
    const { lexer } = await importLib();

    it('should pass correct atrule', () => {
        assert.strictEqual(lexer.checkAtruleName('media'), undefined);
    });

    it('should pass correct vendor atrule', () => {
        assert.strictEqual(lexer.checkAtruleName('-webkit-media'), undefined); // FIXME: should fail because never exists
        assert.strictEqual(lexer.checkAtruleName('-webkit-keyframes'), undefined);
    });

    it('should fail on invalid atrule', () => {
        const error = lexer.checkAtruleName('foo');
        assert.strictEqual(error.name, 'SyntaxReferenceError');
        assert.strictEqual(error.message, 'Unknown at-rule `@foo`');
    });
});
