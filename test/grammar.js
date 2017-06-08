var assert = require('assert');
var parse = require('../lib').syntax.grammar.parse;
var translate = require('../lib').syntax.grammar.translate;
var walk = require('../lib').syntax.grammar.walk;
var data = require('../data');

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

        assert.equal(ast.type, 'Group');
        assert.equal(normalize(translate(ast)), normalize(syntax));
    });
}

describe('grammar', function() {
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
            'Group',       // [ a b ]
            'Group',       // empty sequence in c()
            'Function',    // c()
            'Group',       // c()?  // implicit group -> [ c() ]?
            'Type',        // <d>
            'Property',    // <'e'>
            'Keyword',     // f
            'Group',       // f{2,4}  // implicit group -> [ f ]{2,4}
            'Group',       // [ f{2,4} ]
            'Parentheses', // ( [ f{2,4} ] )
            'Group',       // [ <d> || <'e'> || ( [ f{2,4} ] ) ]*
            'Group',       // [ c()? && [<d> || <'e'> || ( [ f{2,4} ] ) ]* ]
            'Group'        // [ [ a b ] | [ c()? && [<d> || <'e'> || ( [ f{2,4} ] ) ]* ] ]
        ]);
    });
});
