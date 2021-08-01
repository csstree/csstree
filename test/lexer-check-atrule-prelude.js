import assert from 'assert';
import importLib from './helpers/lib.js';

describe('Lexer#checkAtrulePrelude()', async () => {
    const { lexer } = await importLib();

    it('should fail on invalid atrule', () => {
        const error = lexer.checkAtrulePrelude('foo');
        assert.strictEqual(error.name, 'SyntaxReferenceError');
        assert.strictEqual(error.message, 'Unknown at-rule `@foo`');
    });

    it('should fail when prelude is set for at-rule with no prelude', () => {
        const error = lexer.checkAtrulePrelude('font-face', 'hi');
        assert.strictEqual(error.message, 'At-rule `@font-face` should not contain a prelude');
    });

    it('should pass when no prelude for at-rule with no prelude', () => {
        assert.strictEqual(lexer.checkAtrulePrelude('font-face', ''), undefined);
        assert.strictEqual(lexer.checkAtrulePrelude('font-face', null), undefined);
        assert.strictEqual(lexer.checkAtrulePrelude('font-face'), undefined);
    });

    it('should fail when prelude is not set for at-rule with prelude', () => {
        assert.strictEqual(
            lexer.checkAtrulePrelude('keyframes', '').message,
            'At-rule `@keyframes` should contain a prelude'
        );
        assert.strictEqual(
            lexer.checkAtrulePrelude('keyframes', null).message,
            'At-rule `@keyframes` should contain a prelude'
        );
        assert.strictEqual(
            lexer.checkAtrulePrelude('keyframes').message,
            'At-rule `@keyframes` should contain a prelude'
        );
    });

    it('should pass when prelude for at-rule with prelude', () => {
        assert.strictEqual(lexer.checkAtrulePrelude('keyframes', 'test'), undefined);
    });
});
