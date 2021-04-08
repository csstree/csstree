const assert = require('assert');
const { lexer } = require('./helpers/lib');

describe('Lexer#checkAtruleName()', () => {
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
