import assert from 'assert';
import importLib from './helpers/lib.js';

describe('lexer', async () => {
    const { lexer, createLexer, fork } = await importLib();

    it('should not override generic types when used', () => {
        const customLexer = createLexer({
            generic: true,
            types: {
                length: 'foo'
            }
        });

        assert.strictEqual(customLexer.matchType('length', 'foo').matched, null);
        assert.notStrictEqual(customLexer.matchType('length', '1px').matched, null);
    });

    it('should not use generic type names when generics are not used', () => {
        const customLexer = createLexer({
            types: {
                length: 'foo'
            }
        });

        assert.notStrictEqual(customLexer.matchType('length', 'foo').matched, null);
        assert.strictEqual(customLexer.matchType('length', '1px').matched, null);
    });

    it('validate()', () => {
        const customLexer = createLexer({
            generic: true,
            types: {
                ref: '<string>',
                valid: '<number> <ref>',
                invalid: '<foo>'
            },
            properties: {
                ref: '<valid>',
                valid: '<ident> <\'ref\'>',
                invalid: '<invalid>'
            }
        });

        assert.deepStrictEqual(customLexer.validate(), {
            types: [
                'invalid'
            ],
            properties: [
                'invalid'
            ]
        });
    });

    describe('should allow append definitions', function() {
        const customSyntax = fork({
            properties: {
                color: '| foo',
                new: '| foo'
            },
            types: {
                length: '| foo',
                box: '| foo',
                new: '| foo'
            }
        });

        it('properties', () => {
            assert.notStrictEqual(customSyntax.lexer.matchProperty('color', 'foo').matched, null);
            assert.notStrictEqual(customSyntax.lexer.matchProperty('new', 'foo').matched, null);
        });
        it('types', () => {
            assert.notStrictEqual(customSyntax.lexer.matchType('box', 'foo').matched, null);
            assert.notStrictEqual(customSyntax.lexer.matchType('new', 'foo').matched, null);
        });
        it('should not append to generic', () => {
            assert.strictEqual(customSyntax.lexer.matchType('length', 'foo').matched, null);
        });
    });

    it('default syntax shouldn\'t to be broken', () => {
        assert.strictEqual(lexer.validate(), null);
    });

    describe('dump & recovery', () => {
        const customLexer = createLexer({
            generic: true,
            types: {
                foo: '<number>'
            },
            properties: {
                test: '<foo>+'
            }
        });

        it('custom syntax should not affect base syntax', () => {
            assert.strictEqual(lexer.validate(), null);
            assert.strictEqual(lexer.matchProperty('test', '1 2 3').matched, null);
            assert.notStrictEqual(lexer.matchProperty('color', 'red').matched, null);
        });

        it('custom syntax should be valid and correct', () => {
            assert.strictEqual(customLexer.validate(), null);
        });

        it('custom syntax should match own grammar only', () => {
            assert.notStrictEqual(customLexer.matchProperty('test', '1 2 3').matched, null);
            assert.strictEqual(customLexer.matchProperty('color', 'red').matched, null);
        });

        it('recovery syntax from dump', () => {
            const recoverySyntax = fork(prev => ({
                ...prev,
                ...customLexer.dump()
            }));

            assert.strictEqual(recoverySyntax.lexer.validate(), null);
            assert.notStrictEqual(recoverySyntax.lexer.matchProperty('test', '1 2 3').matched, null);
        });
    });
});
