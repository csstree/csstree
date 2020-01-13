const assert = require('assert');
const { lexer, createLexer, fork } = require('./helpers/lib');

describe('lexer', () => {
    it('should not override generic types when used', () => {
        const customLexer = createLexer({
            generic: true,
            types: {
                length: 'foo'
            }
        });

        assert.equal(customLexer.matchType('length', 'foo').matched, null);
        assert.notEqual(customLexer.matchType('length', '1px').matched, null);
    });

    it('should not use generic type names when generics are not used', () => {
        const customLexer = createLexer({
            types: {
                length: 'foo'
            }
        });

        assert.notEqual(customLexer.matchType('length', 'foo').matched, null);
        assert.equal(customLexer.matchType('length', '1px').matched, null);
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

        assert.deepEqual(customLexer.validate(), {
            types: [
                'invalid'
            ],
            properties: [
                'invalid'
            ]
        });
    });

    it('default syntax shouldn\'t to be broken', () => {
        assert.equal(lexer.validate(), null);
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
            assert.equal(lexer.validate(), null);
            assert.equal(lexer.matchProperty('test', '1 2 3').matched, null);
            assert.notEqual(lexer.matchProperty('color', 'red').matched, null);
        });

        it('custom syntax should be valid and correct', () => {
            assert.equal(customLexer.validate(), null);
        });

        it('custom syntax should match own grammar only', () => {
            assert.notEqual(customLexer.matchProperty('test', '1 2 3').matched, null);
            assert.equal(customLexer.matchProperty('color', 'red').matched, null);
        });

        it('recovery syntax from dump', () => {
            const recoverySyntax = fork(prev => ({
                ...prev,
                ...customLexer.dump()
            }));

            assert.equal(recoverySyntax.lexer.validate(), null);
            assert.notEqual(recoverySyntax.lexer.matchProperty('test', '1 2 3').matched, null);
        });
    });
});
