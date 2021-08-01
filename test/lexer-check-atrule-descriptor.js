import assert from 'assert';
import importLib from './helpers/lib.js';

describe('Lexer#checkAtruleDescriptorName()', async () => {
    const { lexer } = await importLib();

    it('should fail on invalid atrule', () => {
        const error = lexer.checkAtruleDescriptorName('foo');
        assert.strictEqual(error.name, 'SyntaxReferenceError');
        assert.strictEqual(error.message, 'Unknown at-rule `@foo`');
    });

    it('should fail when at-rule has no descriptors', () => {
        const error = lexer.checkAtruleDescriptorName('import', 'test');
        assert.strictEqual(error.message, 'At-rule `@import` has no known descriptors');
    });

    it('should fail when at-rule has no descriptor', () => {
        const error = lexer.checkAtruleDescriptorName('font-face', 'color');
        assert.strictEqual(error.message, 'Unknown at-rule descriptor `color`');
    });

    it('should pass on correct descriptor', () => {
        const error = lexer.checkAtruleDescriptorName('font-face', 'font-family');
        assert.strictEqual(error, undefined);
    });
});
