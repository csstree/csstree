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
            var match = syntax.matchProperty(property, css);

            assert.equal(match.matched, null);
            assert(new RegExp('^SyntaxMatchError: ' + error).test(match.error));
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
            assert(syntax.lexer.matchProperty('test', parseCss('1 2 3', { context: 'value' })).matched === null);
            assert(syntax.lexer.matchProperty('color', parseCss('red', { context: 'value' })).matched !== null);
        });

        it('custom syntax should be valid and correct', function() {
            assert.equal(customSyntax.lexer.validate(), null);
        });

        it('custom syntax should match own grammar only', function() {
            assert(customSyntax.lexer.matchProperty('test', parseCss('1 2 3', { context: 'value' })).matched !== null);
            assert(customSyntax.lexer.matchProperty('color', parseCss('red', { context: 'value' })).matched === null);
        });

        it('recovery syntax from dump', function() {
            var recoverySyntax = syntax.fork(function(prev, assign) {
                return assign(prev, customSyntax.lexer.dump());
            });

            assert.equal(recoverySyntax.lexer.validate(), null);
            assert(recoverySyntax.lexer.matchProperty('test', parseCss('1 2 3', { context: 'value' })).matched !== null);
        });
    });

    describe('matchProperty', function() {
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

        describe('vendor prefixes and hacks', function() {
            it('vendor prefix', function() {
                var match = customSyntax.lexer.matchProperty('-vendor-foo', bar);

                assert(match.matched);
                assert.equal(match.error, null);
            });
            it('hacks', function() {
                var match = customSyntax.lexer.matchProperty('_foo', bar);

                assert(match.matched);
                assert.equal(customSyntax.lexer.lastMatchError, null);
            });
            it('vendor prefix and hack', function() {
                var match = customSyntax.lexer.matchProperty('_-vendor-foo', bar);

                assert(match.matched);
                assert.equal(customSyntax.lexer.lastMatchError, null);
            });
            it('case insensetive with vendor prefix and hack', function() {
                var match;

                match = customSyntax.lexer.matchProperty('FOO', bar);
                assert(match.matched);
                assert.equal(match.error, null);

                match = customSyntax.lexer.matchProperty('-VENDOR-Foo', bar);
                assert(match.matched);
                assert.equal(match.error, null);

                match = customSyntax.lexer.matchProperty('_FOO', bar);
                assert(match.matched);
                assert.equal(match.error, null);

                match = customSyntax.lexer.matchProperty('_-VENDOR-Foo', bar);
                assert(match.matched);
                assert.equal(match.error, null);
            });
            it('should use verdor version first', function() {
                var match;

                match = customSyntax.lexer.matchProperty('-baz-foo', qux);
                assert(match.matched);
                assert.equal(match.error, null);

                match = customSyntax.lexer.matchProperty('-baz-baz-foo', qux);
                assert.equal(match.matched, null);
                assert.equal(match.error.message, 'Unknown property: -baz-baz-foo');
            });
        });

        it('custom property', function() {
            var match = syntax.lexer.matchProperty('--foo', bar);

            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'Lexer matching doesn\'t applicable for custom properties');
        });

        tests.forEachTest(createMatchTest);
    });

    describe('matchDeclaration', function() {
        it('should match', function() {
            var declaration = parseCss('color: red', { context: 'declaration' });
            var match = syntax.lexer.matchDeclaration(declaration);

            assert(match.matched);
            assert(match.isNodeType(declaration.value.children.first(), 'color'));
            assert.equal(match.error, null);
        });
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
            var match = customSyntax.lexer.matchType('bar', singleNumber);

            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('should match type using nested', function() {
            var match = customSyntax.lexer.matchType('foo', severalNumbers);

            assert(match.matched);
            assert.equal(match.error, null);
        });

        it('should fail on matching wrong value', function() {
            var match = customSyntax.lexer.matchType('bar', severalNumbers);

            assert.equal(match.matched, null);
            assert.equal(match.error.rawMessage, 'Uncomplete match');
        });

        it('should return null and save error for unknown type', function() {
            var match = customSyntax.lexer.matchType('baz', singleNumber);

            assert.equal(match.matched, null);
            assert.equal(match.error.message, 'Unknown type: baz');
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
                var error = result.error;

                assert.equal(result.matched, null);
                assert(Boolean(error));
                assert.equal(error.column, test.column);
            });
        });
    });

    describe('trace', function() {
        var ast = parseCss('rgb(1, 2, 3)', { context: 'value' });
        var testNode = ast.children.first().children.first();
        var match = syntax.lexer.matchProperty('background', ast);

        it('getNodeTrace', function() {
            assert.deepEqual(match.getNodeTrace(testNode), [
                { type: 'Type', name: 'final-bg-layer' },
                { type: 'Property', name: 'background-color' },
                { type: 'Type', name: 'color' },
                { type: 'Type', name: 'rgb()' },
                { type: 'Type', name: 'number' }
            ]);
        });

        it('isNodeType', function() {
            assert.equal(match.isNodeType(testNode, 'color'), true);
            assert.equal(match.isNodeType(testNode, 'final-bg-layer'), true);
            assert.equal(match.isNodeType(testNode, 'background-color'), false);
            assert.equal(match.isNodeType(testNode, 'foo'), false);
        });

        it('isNodeProperty', function() {
            assert.equal(match.isNodeProperty(testNode, 'color'), false);
            assert.equal(match.isNodeProperty(testNode, 'final-bg-layer'), false);
            assert.equal(match.isNodeProperty(testNode, 'background-color'), true);
            assert.equal(match.isNodeProperty(testNode, 'foo'), false);
        });

        it('isKeyword', function() {
            var ast = parseCss('repeat 0', { context: 'value' });
            var keywordNode = ast.children.first();
            var numberNode = ast.children.last();
            var match = syntax.lexer.matchProperty('background', ast);

            assert.equal(match.isKeyword(keywordNode), true);
            assert.equal(match.isKeyword(numberNode), false);
        });
    });
});
