var assert = require('assert');
var parseCss = require('../lib').parse;
var syntax = require('../lib');
var tests = require('./fixture/syntax');

function createMatchTest(name, syntax, property, value, error) {
    if (error) {
        it(name, function() {
            var css = parseCss(value, {
                context: 'value',
                property: property
            });

            assert.equal(syntax.matchProperty(property, css), null);
            assert(new RegExp('^SyntaxMatchError: ' + error).test(syntax.lastMatchError));
        });
    } else {
        it(name, function() {
            var css = parseCss(value, {
                context: 'value',
                property: property
            });

            assert(Boolean(syntax.matchProperty(property, css)));
        });
    }
}

describe('lexer', function() {
    it('validate', function() {
        var customSyntax = syntax.fork(function(prev, assign) {
            return assign(prev, {
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
        });

        assert.deepEqual(customSyntax.lexer.validate(), {
            types: [
                'invalid'
            ],
            properties: [
                'invalid'
            ]
        });
    });

    it('default syntax shouldn\'t to be broken', function() {
        assert.equal(syntax.lexer.validate(), null);
    });

    describe('dump & recovery', function() {
        var customSyntax = syntax.fork(function(prev, assign) {
            return assign(prev, {
                generic: true,
                types: {
                    foo: '<number>'
                },
                properties: {
                    test: '<foo>+'
                }
            });
        });

        it('custom syntax should not affect base syntax', function() {
            assert.equal(syntax.lexer.validate(), null);
            assert(syntax.lexer.matchProperty('test', parseCss('1 2 3', { context: 'value' })) === null);
            assert(syntax.lexer.matchProperty('color', parseCss('red', { context: 'value' })));
        });

        it('custom syntax should be valid and correct', function() {
            assert.equal(customSyntax.lexer.validate(), null);
        });

        it('custom syntax should match own grammar only', function() {
            assert(customSyntax.lexer.matchProperty('test', parseCss('1 2 3', { context: 'value' })));
            assert(customSyntax.lexer.matchProperty('color', parseCss('red', { context: 'value' })) === null);
        });

        it('recovery syntax from dump', function() {
            var recoverySyntax = syntax.fork(function(prev, assign) {
                return assign(prev, customSyntax.lexer.dump());
            });

            assert.equal(recoverySyntax.lexer.validate(), null);
            assert(recoverySyntax.lexer.matchProperty('test', parseCss('1 2 3', { context: 'value' })));
        });
    });

    describe('matchProperty', function() {
        describe('vendor prefixes and hacks', function() {
            var bar = parseCss('bar', { context: 'value' });
            var qux = parseCss('qux', { context: 'value' });
            var customSyntax = syntax.fork(function(prev, assign) {
                return assign(prev, {
                    properties: {
                        foo: 'bar',
                        '-baz-foo': 'qux'
                    }
                });
            });

            it('vendor prefix', function() {
                assert(customSyntax.lexer.matchProperty('-vendor-foo', bar));
                assert.equal(customSyntax.lexer.lastMatchError, null);
            });
            it('hacks', function() {
                assert(customSyntax.lexer.matchProperty('_foo', bar));
                assert.equal(customSyntax.lexer.lastMatchError, null);
            });
            it('vendor prefix and hack', function() {
                assert(customSyntax.lexer.matchProperty('_-vendor-foo', bar));
                assert.equal(customSyntax.lexer.lastMatchError, null);
            });
            it('case insensetive with vendor prefix and hack', function() {
                assert(customSyntax.lexer.matchProperty('FOO', bar));
                assert(customSyntax.lexer.matchProperty('-VENDOR-Foo', bar));
                assert(customSyntax.lexer.matchProperty('_FOO', bar));
                assert(customSyntax.lexer.matchProperty('_-VENDOR-Foo', bar));
                assert.equal(customSyntax.lexer.lastMatchError, null);
            });
            it('should use verdor version first', function() {
                assert(customSyntax.lexer.matchProperty('-baz-foo', qux));
                assert.equal(customSyntax.lexer.matchProperty('-baz-baz-foo', qux), null);
                assert.equal(customSyntax.lexer.lastMatchError.message, 'Unknown property: -baz-baz-foo');
            });
        });

        tests.forEachTest(createMatchTest);
    });

    describe('matchType', function() {
        var singleNumber = parseCss('1', { context: 'value' });
        var severalNumbers = parseCss('1, 2, 3', { context: 'value' });
        var customSyntax = syntax.fork(function(prev, assign) {
            return assign(prev, {
                types: {
                    foo: '<bar>#',
                    bar: '[ 1 | 2 | 3 ]'
                }
            });
        });

        it('should match type', function() {
            assert(customSyntax.lexer.matchType('bar', singleNumber));
            assert.equal(customSyntax.lexer.lastMatchError, null);
        });

        it('should match type using nested', function() {
            assert(customSyntax.lexer.matchType('foo', severalNumbers));
            assert.equal(customSyntax.lexer.lastMatchError, null);
        });

        it('should fail on matching wrong value', function() {
            assert.equal(customSyntax.lexer.matchType('bar', severalNumbers), null);
            assert.equal(customSyntax.lexer.lastMatchError.rawMessage, 'Uncomplete match');
        });

        it('should return null and save error for unknown type', function() {
            assert.equal(customSyntax.lexer.matchType('baz', singleNumber), null);
            assert.equal(customSyntax.lexer.lastMatchError.message, 'Unknown type: baz');
        });
    });

    describe('mismatch node', function() {
        var customSyntax = syntax.fork(function(prev, assign) {
            return assign(prev, {
                generic: true,
                properties: {
                    'test1': '<foo()>',
                    'test2': '<bar>',
                    'test3': '<baz()>'
                },
                types: {
                    'foo()': 'foo( <number>#{3} )',
                    'bar': 'bar( <angle> )',
                    'baz()': 'baz( <angle> | <number> )'
                }
            });
        });
        var tests = [
            { property: 'test1', value: 'foo(1, 2px, 3)', column: 8 },
            { property: 'test1', value: 'foo(1, 2, 3, 4)', column: 12 },
            { property: 'test1', value: 'foo(1, 211px)', column: 8 },
            { property: 'test1', value: 'foo(1, 2 3)', column: 10 },
            { property: 'test1', value: 'foo(1, 2)', column: 9, skip: true },
            { property: 'test2', value: 'bar( foo )', column: 6 },
            { property: 'test3', value: 'baz( foo )', column: 6 },
            { property: 'test3', value: 'baz( 1px )', column: 6 }
        ];

        tests.forEach(function(test) {
            (test.skip ? it.skip : it)(test.value, function() {
                var ast = parseCss(test.value, { context: 'value', positions: true });
                var result = customSyntax.lexer.matchProperty(test.property, ast);
                var error = customSyntax.lexer.lastMatchError;

                assert.equal(result, null);
                assert(Boolean(error));
                assert.equal(error.column, test.column);
            });
        });
    });
});
