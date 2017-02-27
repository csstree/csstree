var assert = require('assert');
var parseCss = require('../lib').parse;
var defaultSyntax = require('../lib').defaultLexer;
var createSyntax = require('../lib').createSyntax;
var parse = require('../lib').syntax.grammar.parse;
var translate = require('../lib').syntax.grammar.translate;
var walk = require('../lib').syntax.grammar.walk;
var data = require('../data');
var tests = require('./fixture/syntax');

function normalize(str) {
    // Looks like there is no common rules for spaces (some syntaxes
    // may have a extra space or miss some)
    // e.g. rgba( <rgb-component>#{3} , <alpha-value> )
    // but  hsl( <hue>, <percentage>, <percentage> )

    return str.replace(/\B\s\B/g, '');
}

function createParseTest(name, syntax) {
    it(name, function() {
        var ast = parse(syntax);

        assert.equal(ast.type, 'Sequence');
        assert.equal(normalize(translate(ast)), normalize(syntax));
    });
}

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

describe('CSS syntax', function() {
    it('combinator precedence', function() {
        var ast = parse('a b   |   c ||   d &&   e f');
        assert.equal(translate(ast, true), '[ [ a b ] | [ c || [ d && [ e f ] ] ] ]');
    });

    describe('bad syntax', function() {
        it('expected a quote', function() {
            assert.throws(function() {
                parse('\'x');
            }, /^SyntaxParseError: Expect a quote\n/);
        });

        it('expected a number', function() {
            var tests = [
                '<x>{}',
                '<x>{,2}',
                '<x>{ 2}',
                '<x>{1, }'
            ];
            tests.forEach(function(test) {
                assert.throws(function() {
                    parse(test);
                }, /^SyntaxParseError: Expect a number\n/, test);
            });
        });

        it('missed keyword', function() {
            var tests = [
                '<>',
                '<\'\'>'
            ];
            tests.forEach(function(test) {
                assert.throws(function() {
                    parse(test);
                }, /^SyntaxParseError: Expect a keyword\n/, test);
            });
        });

        it('unexpected combinator', function() {
            var tests = [
                '<x>&&',
                '&&<x>',
                '<x>&&||'
            ];
            tests.forEach(function(test) {
                assert.throws(function() {
                    parse(test);
                }, /^SyntaxParseError: Unexpected combinator\n/, test);
            });
        });

        it('unexpected input', function() {
            assert.throws(function() {
                parse('!');
            }, /^SyntaxParseError: Unexpected input\n/);
        });

        it('bad syntax', function() {
            var tests = [
                'a&b',
                '<a',
                'b(',
                '[a'
            ];
            tests.forEach(function(test) {
                assert.throws(function() {
                    parse(test);
                }, /^SyntaxParseError: Expect `.`\n/, test);
            });
        });
    });

    describe('Syntax', function() {
        it('validate', function() {
            var syntax = createSyntax({
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

            assert.deepEqual(syntax.validate(), {
                types: [
                    'invalid'
                ],
                properties: [
                    'invalid'
                ]
            });
        });

        it('default syntax shouldn\'t to be broken', function() {
            assert.equal(defaultSyntax.validate(), null);
        });

        describe('dump & recovery', function() {
            var syntax = createSyntax({
                generic: true,
                types: {
                    foo: '<number>'
                },
                properties: {
                    test: '<foo>+'
                }
            });

            it('syntax should be valid and correct', function() {
                assert.equal(defaultSyntax.validate(), null);
                assert(syntax.matchProperty('test', parseCss('1 2 3', { context: 'value' })));
            });

            it('recovery syntax from dump', function() {
                var recoverySyntax = createSyntax(syntax.dump());

                assert.equal(recoverySyntax.validate(), null);
                assert(recoverySyntax.matchProperty('test', parseCss('1 2 3', { context: 'value' })));
            });
        });
    });

    describe('parse/translate', function() {
        ['properties', 'types'].forEach(function(section) {
            for (var name in data[section]) {
                createParseTest(section + '/' + name, data[section][name]);
            }
        });
    });

    it('walker', function() {
        var ast = parse('a b | c()? && [ <d> || <\'e\'> || ( f{2,4} ) ]*');
        var visited = [];

        walk(ast, function(node) {
            visited.push(node.type);
        });

        assert.deepEqual(visited, [
            'Keyword',     // a
            'Keyword',     // b
            'Sequence',    // [ a b ]
            'Sequence',    // empty sequence in c()
            'Function',    // c()?
            'Type',        // <d>
            'Property',    // <'e'>
            'Keyword',     // f{2,4}
            'Sequence',    // [ f{2,4} ]
            'Parentheses', // ( [ f{2,4} ] )
            'Group',       // [ <d> || <'e'> || ( [ f{2,4} ] ) ]*
            'Sequence',    // [ c()? && [<d> || <'e'> || ( [ f{2,4} ] ) ]* ]
            'Sequence'     // [ [ a b ] | [ c()? && [<d> || <'e'> || ( [ f{2,4} ] ) ]* ] ]
        ]);
    });

    describe('matchProperty', function() {
        describe('vendor prefixes and hacks', function() {
            var bar = parseCss('bar', { context: 'value' });
            var qux = parseCss('qux', { context: 'value' });
            var syntax = createSyntax({
                properties: {
                    foo: 'bar',
                    '-baz-foo': 'qux'
                }
            });

            it('vendor prefix', function() {
                assert(syntax.matchProperty('-vendor-foo', bar));
                assert.equal(syntax.lastMatchError, null);
            });
            it('hacks', function() {
                assert(syntax.matchProperty('_foo', bar));
                assert.equal(syntax.lastMatchError, null);
            });
            it('vendor prefix and hack', function() {
                assert(syntax.matchProperty('_-vendor-foo', bar));
                assert.equal(syntax.lastMatchError, null);
            });
            it('case insensetive with vendor prefix and hack', function() {
                assert(syntax.matchProperty('FOO', bar));
                assert(syntax.matchProperty('-VENDOR-Foo', bar));
                assert(syntax.matchProperty('_FOO', bar));
                assert(syntax.matchProperty('_-VENDOR-Foo', bar));
                assert.equal(syntax.lastMatchError, null);
            });
            it('should use verdor version first', function() {
                assert(syntax.matchProperty('-baz-foo', qux));
                assert.equal(syntax.matchProperty('-baz-baz-foo', qux), null);
                assert.equal(syntax.lastMatchError.message, 'Unknown property: -baz-baz-foo');
            });
        });

        tests.forEachTest(createMatchTest);
    });

    describe('matchType', function() {
        var singleNumber = parseCss('1', { context: 'value' });
        var severalNumbers = parseCss('1, 2, 3', { context: 'value' });
        var syntax = createSyntax({
            types: {
                foo: '<bar>#',
                bar: '[ 1 | 2 | 3 ]'
            }
        });

        it('should match type', function() {
            assert(syntax.matchType('bar', singleNumber));
            assert.equal(syntax.lastMatchError, null);
        });

        it('should match type using nested', function() {
            assert(syntax.matchType('foo', severalNumbers));
            assert.equal(syntax.lastMatchError, null);
        });

        it('should fail on matching wrong value', function() {
            assert.equal(syntax.matchType('bar', severalNumbers), null);
            assert.equal(syntax.lastMatchError.rawMessage, 'Uncomplete match');
        });

        it('should return null and save error for unknown type', function() {
            assert.equal(syntax.matchType('baz', singleNumber), null);
            assert.equal(syntax.lastMatchError.message, 'Unknown type: baz');
        });
    });

    describe('mismatch node', function() {
        var syntax = createSyntax({
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
                var result = syntax.matchProperty(test.property, ast);
                var error = syntax.lastMatchError;

                assert.equal(result, null);
                assert(Boolean(error));
                assert.equal(error.column, test.column);
            });
        });
    });
});
