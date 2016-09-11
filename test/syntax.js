var assert = require('assert');
var parseCss = require('../lib/parser.js');
// var stringifyCss = require('./helpers/stringify');
var defaultSyntax = require('../lib/syntax/default');
var createSyntax = require('../lib/syntax').create;
var parse = require('../lib/syntax/parse.js');
var stringify = require('../lib/syntax/stringify.js');
var walk = require('../lib/syntax/walk.js');
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
    it(name, function() {
        var css = parseCss(value, {
            context: 'value',
            property: property
        });

        if (error) {
            assert.throws(function() {
                syntax.match(property, css);
            }, new RegExp('^SyntaxMatchError: ' + error));
        } else {
            // left it for future
            // assert.equal(
            //     stringifyCss(syntax.match('test', css)),
            //     stringifyCss(test.match)
            // );

            assert(Boolean(syntax.match(property, css)));
        }
    });
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
                assert(syntax.match('test', parseCss('1 2 3', { context: 'value' })));
            });

            it('recovery syntax from dump', function() {
                var recoverySyntax = createSyntax(syntax.dump());

                assert.equal(recoverySyntax.validate(), null);
                assert(recoverySyntax.match('test', parseCss('1 2 3', { context: 'value' })));
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
                assert(syntax.match('-vendor-foo', bar));
            });
            it('hacks', function() {
                assert(syntax.match('_foo', bar));
            });
            it('vendor prefix and hack', function() {
                assert(syntax.match('_-vendor-foo', bar));
            });
            it('case insensetive with vendor prefix and hack', function() {
                assert(syntax.match('FOO', bar));
                assert(syntax.match('-VENDOR-Foo', bar));
                assert(syntax.match('_FOO', bar));
                assert(syntax.match('_-VENDOR-Foo', bar));
            });
            it('should use verdor version first', function() {
                assert(syntax.match('-baz-foo', qux));
                assert.throws(function() {
                    assert(syntax.match('-baz-baz-foo', qux));
                }, /Unknown property/);
            });
        });

        tests.forEachTest(createMatchTest);
    });
});
