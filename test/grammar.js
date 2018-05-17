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
        assert.equal(generate(ast, { forceBraces: true }), '[ [ a b ] | [ c || [ d && [ e f ] ] ] ]');
    });

    describe('bad syntax', function() {
        it('expected a quote', function() {
            assert.throws(function() {
                parse('\'x');
            }, /^SyntaxParseError: Expect an apostrophe\n/);
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
            var tests = [
                '#',
                '?',
                '+',
                '*',
                '!',
                '[]]',
                '{1}'
            ];
            tests.forEach(function(test) {
                assert.throws(function() {
                    parse(test);
                }, /^SyntaxParseError: Unexpected input\n/);
            });
        });

        it('bad syntax', function() {
            var tests = [
                'a&b',
                '<a',
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

        describe('with decorate', function() {
            it('basic', function() {
                var ast = parse('<foo> && <bar>');
                var expected = '*{<foo>} && {<bar>}*';
                var actual = generate(ast, function(str, node) {
                    switch (node.type) {
                        case 'Type':
                            return '{' + str + '}';

                        case 'Group':
                            return '*' + str + '*';

                        default:
                            return str;
                    }
                });

                assert.equal(actual, expected);
            });

            it('all the node types', function() {
                var ast = parse('<foo> && <\'bar\'> | [ ( a+, b( \'c\' / <d>#{1,2} ) ) ]!');
                var expected = '{Group}{Group}{Type}<foo>{/Type} && {Property}<\'bar\'>{/Property}{/Group} | {Group}[ {Token}({/Token} {Keyword}a{/Keyword}{Multiplier}+{/Multiplier} {Comma},{/Comma} {Function}b({/Function} {String}\'c\'{/String} {Token}/{/Token} {Type}<d>{/Type}{Multiplier}#{1,2}{/Multiplier} {Token}){/Token} {Token}){/Token} ]!{/Group}{/Group}';
                var actual = generate(ast, function(str, node) {
                    return '{' + node.type + '}' + str + '{/' + node.type + '}';
                });

                assert.equal(actual, expected);
            });
        });
    });

    describe('walk', function() {
        it('pass a single walk function', function() {
            var ast = parse('a b | c() && [ <d>? || <\'e\'> || ( f{2,4} ) ]*');
            var visited = [];

            walk(ast, function(node) {
                visited.push({
                    type: node.type,
                    value: generate(node)
                });
            });

            assert.deepEqual(visited, [
                { type: 'Group',       value: 'a b | c( ) && [ <d>? || <\'e\'> || ( f{2,4} ) ]*' },
                { type: 'Group',       value: 'a b' },        // implicit group: a b -> [ a b ]
                { type: 'Keyword',     value: 'a' },
                { type: 'Keyword',     value: 'b' },
                { type: 'Group',       value: 'c( ) && [ <d>? || <\'e\'> || ( f{2,4} ) ]*' },
                { type: 'Group',       value: 'c( )' },
                { type: 'Function',    value: 'c(' },
                { type: 'Token',       value: ')' },
                { type: 'Multiplier',  value: '[ <d>? || <\'e\'> || ( f{2,4} ) ]*' },
                { type: 'Group',       value: '[ <d>? || <\'e\'> || ( f{2,4} ) ]' },
                { type: 'Multiplier',  value: '<d>?' },
                { type: 'Type',        value: '<d>' },
                { type: 'Property',    value: '<\'e\'>' },
                { type: 'Group',       value: '( f{2,4} )' },
                { type: 'Token',       value: '(' },
                { type: 'Multiplier',  value: 'f{2,4}' },
                { type: 'Keyword',     value: 'f' },
                { type: 'Token',       value: ')' }
            ]);
        });

        it('pass a pair of walk functions', function() {
            var ast = parse('a b? | c() && [ <d> ]+');
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
                { action: 'enter', value: 'a b? | c( ) && [ <d> ]+' },
                { action: 'enter', value: 'a b?' },
                { action: 'enter', value: 'a' },
                { action: 'leave', value: 'a' },
                { action: 'enter', value: 'b?' },
                { action: 'enter', value: 'b' },
                { action: 'leave', value: 'b' },
                { action: 'leave', value: 'b?' },
                { action: 'leave', value: 'a b?' },
                { action: 'enter', value: 'c( ) && [ <d> ]+' },
                { action: 'enter', value: 'c( )' },
                { action: 'enter', value: 'c(' },
                { action: 'leave', value: 'c(' },
                { action: 'enter', value: ')' },
                { action: 'leave', value: ')' },
                { action: 'leave', value: 'c( )' },
                { action: 'enter', value: '[ <d> ]+' },
                { action: 'enter', value: '[ <d> ]' },
                { action: 'enter', value: '<d>' },
                { action: 'leave', value: '<d>' },
                { action: 'leave', value: '[ <d> ]' },
                { action: 'leave', value: '[ <d> ]+' },
                { action: 'leave', value: 'c( ) && [ <d> ]+' },
                { action: 'leave', value: 'a b? | c( ) && [ <d> ]+' }
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
