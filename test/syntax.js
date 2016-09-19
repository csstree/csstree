var assert = require('assert');
var parseCss = require('../lib/parser');
var defaultSyntax = require('../lib/syntax/default');
var createSyntax = require('../lib/syntax').create;
var parse = require('../lib/syntax/parse');
var stringify = require('../lib/syntax/stringify');
var walk = require('../lib/syntax/walk');
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
        assert.equal(normalize(stringify(ast)), normalize(syntax));
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
        assert.equal(stringify(ast, true), '[ [ a b ] | [ c || [ d && [ e f ] ] ] ]');
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

    describe('parse/stringify', function() {
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

    describe('match', function() {
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
            });
            it('hacks', function() {
                assert(syntax.matchProperty('_foo', bar));
            });
            it('vendor prefix and hack', function() {
                assert(syntax.matchProperty('_-vendor-foo', bar));
            });
            it('case insensetive with vendor prefix and hack', function() {
                assert(syntax.matchProperty('FOO', bar));
                assert(syntax.matchProperty('-VENDOR-Foo', bar));
                assert(syntax.matchProperty('_FOO', bar));
                assert(syntax.matchProperty('_-VENDOR-Foo', bar));
            });
            it('should use verdor version first', function() {
                assert(syntax.matchProperty('-baz-foo', qux));
                assert.equal(syntax.matchProperty('-baz-baz-foo', qux), null);
                assert(/Unknown property/.test(syntax.lastMatchError));
            });
        });

        tests.forEachTest(createMatchTest);
    });
});
