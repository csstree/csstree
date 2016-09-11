var assert = require('assert');
var parseCss = require('../lib/parser.js');
// var stringifyCss = require('./helpers/stringify');
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

    describe('parse/stringify', function() {
        ['properties', 'syntaxes'].forEach(function(section) {
            for (var name in data[section]) {
                var info = data[section][name];
                var syntax = info.syntax || info;

                createParseTest(section + '/' + name, syntax);
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
