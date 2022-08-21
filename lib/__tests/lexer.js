import assert from 'assert';
import { lexer, createLexer, fork } from 'css-tree';

describe('lexer', () => {
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

    it('should allow override units', function() {
        const customLexer = createLexer({
            generic: true,
            units: {
                length: ['xx', 'yy']
            }
        });

        assert.deepStrictEqual(customLexer.units.length, ['xx', 'yy']);
        assert.strictEqual(customLexer.matchType('length', '1px').matched, null);
        assert.notStrictEqual(customLexer.matchType('length', '1xx').matched, null);
        assert.notStrictEqual(customLexer.matchType('length', '1yy').matched, null);
    });

    it('should not add new unit groups or discard existing', function() {
        const customLexer = createLexer({
            generic: true,
            units: {
                foo: ['xx', 'yy']
            }
        });

        assert('foo' in customLexer.units === false);
        assert(Object.keys(customLexer.units).length > 0);
        assert.deepStrictEqual(Object.keys(customLexer.units), Object.keys(lexer.units));
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
            units: {
                length: ['aa', 'bb']
            },
            types: {
                foo: '<number> | <length>'
            },
            properties: {
                test: '<foo>+'
            }
        });

        it('custom syntax should not affect base syntax', () => {
            assert.strictEqual(lexer.validate(), null);
            assert.strictEqual(lexer.matchProperty('test', '1 2aa 3').matched, null);
            assert.notStrictEqual(lexer.matchProperty('color', 'red').matched, null);
        });

        it('custom syntax should be valid and correct', () => {
            assert.strictEqual(customLexer.validate(), null);
        });

        it('custom syntax should match own grammar only', () => {
            assert.notStrictEqual(customLexer.matchProperty('test', '1 2aa 3').matched, null);
            assert.strictEqual(customLexer.matchProperty('color', 'red').matched, null);
        });

        it('recovery syntax from dump', () => {
            const recoverySyntax = fork(prev => ({
                ...prev,
                ...customLexer.dump()
            }));

            assert.strictEqual(recoverySyntax.lexer.validate(), null);
            assert.notStrictEqual(recoverySyntax.lexer.matchProperty('test', '1 2aa 3').matched, null);
        });
    });
});
