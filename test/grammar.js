var assert = require('assert');
var parse = require('../lib').grammar.parse;
var generate = require('../lib').grammar.generate;
var walk = require('../lib').grammar.walk;
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
        assert.equal(normalize(generate(ast)), normalize(syntax));
    });
}

describe('grammar', function() {
    it('combinator precedence', function() {
        var ast = parse('a b   |   c ||   d &&   e f');
        assert.equal(generate(ast, true), '[ [ a b ] | [ c || [ d && [ e f ] ] ] ]');
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

    describe('parse/generate', function() {
        ['properties', 'types'].forEach(function(section) {
            Object.keys(data[section]).forEach(function(name) {
                createParseTest(section + '/' + name, data[section][name]);
            });
        });
    });

    describe('generate', function() {
        it('should throw an exception on bad node type', function() {
            assert.throws(function() {
                generate({ type: 'Unknown' });
            }, /Error: Unknown node type `Unknown`/);
        });

        it('with decorate', function() {
            var ast = parse('<foo> && <bar>');
            var actual = generate(ast, false, function(str, node) {
                switch (node.type) {
                    case 'Type':
                        return '{' + str + '}';

                    case 'Group':
                        return '*' + str + '*';

                    default:
                        return str;
                }
            });

            assert.equal(actual, '*{<foo>} && {<bar>}*');
        });
    });

    describe('walk', function() {
        it('pass a single walk function', function() {
            var ast = parse('a b | c()? && [ <d> || <\'e\'> || ( f{2,4} ) ]*');
            var visited = [];

            walk(ast, function(node) {
                visited.push({
                    type: node.type,
                    value: generate(node)
                });
            });

            assert.deepEqual(visited, [
                { type: 'Group',       value: 'a b | c()? && [ <d> || <\'e\'> || ( f{2,4} ) ]*' },
                { type: 'Group',       value: 'a b' },        // implicit group: a b -> [ a b ]
                { type: 'Keyword',     value: 'a' },
                { type: 'Keyword',     value: 'b' },
                { type: 'Group',       value: 'c()? && [ <d> || <\'e\'> || ( f{2,4} ) ]*' },
                { type: 'Group',       value: 'c()?' },       // implicit group: c()? -> [ c() ]?
                { type: 'Function',    value: 'c()' },
                { type: 'Group',       value: '' },           // empty children group: c() -> c( [] )
                { type: 'Group',       value: '[ <d> || <\'e\'> || ( f{2,4} ) ]*' },
                { type: 'Type',        value: '<d>' },
                { type: 'Property',    value: '<\'e\'>' },
                { type: 'Parentheses', value: '( f{2,4} )' },
                { type: 'Group',       value: 'f{2,4}' },     // implicit group: [ f{2,4} ]
                { type: 'Group',       value: 'f{2,4}' },     // implicit group: f{2,4} -> [ f ]{2,4}
                { type: 'Keyword',     value: 'f' }
            ]);
        });

        it('pass a pair of walk functions', function() {
            var ast = parse('a b | c()? && [ <d> ]+');
            var visited = [];

            walk(ast, {
                enter: function(node) {
                    visited.push({
                        action: 'enter',
                        value: generate(node)
                    });
                },
                leave: function(node) {
                    visited.push({
                        action: 'leave',
                        value: generate(node)
                    });
                }
            });

            assert.deepEqual(visited, [
                { action: 'enter', value: 'a b | c()? && [ <d> ]+' },
                { action: 'enter', value: 'a b' },
                { action: 'enter', value: 'a' },
                { action: 'leave', value: 'a' },
                { action: 'enter', value: 'b' },
                { action: 'leave', value: 'b' },
                { action: 'leave', value: 'a b' },
                { action: 'enter', value: 'c()? && [ <d> ]+' },
                { action: 'enter', value: 'c()?' },
                { action: 'enter', value: 'c()' },
                { action: 'enter', value: '' },
                { action: 'leave', value: '' },
                { action: 'leave', value: 'c()' },
                { action: 'leave', value: 'c()?' },
                { action: 'enter', value: '[ <d> ]+' },
                { action: 'enter', value: '<d>' },
                { action: 'leave', value: '<d>' },
                { action: 'leave', value: '[ <d> ]+' },
                { action: 'leave', value: 'c()? && [ <d> ]+' },
                { action: 'leave', value: 'a b | c()? && [ <d> ]+' }
            ]);
        });

        it('should throw an exception when nothing passed as walker handler', function() {
            assert.throws(function() {
                walk(parse('a | b'));
            }, /Neither `enter` nor `leave` walker handler is set or both aren\'t a function/);
        });

        it('should throw an exception when passed object has no enter or leave methods', function() {
            assert.throws(function() {
                walk(parse('a | b'), {});
            }, /Neither `enter` nor `leave` walker handler is set or both aren\'t a function/);
        });
    });
});
