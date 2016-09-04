var assert = require('assert');
var parse = require('../lib/grammar/parse.js');
var stringify = require('../lib/grammar/stringify.js');
var walk = require('../lib/grammar/walk.js');
var data = require('../data/data.json');

function normalize(str) {
    // Looks like there is no common rules for spaces (some syntaxes
    // may have a extra space or miss some)
    // e.g. rgba( <rgb-component>#{3} , <alpha-value> )
    // but  hsl( <hue>, <percentage>, <percentage> )

    return str.replace(/\B\s\B/g, '');
}

function createTest(name, syntax) {
    return it(name, function() {
        var ast = parse(syntax);

        assert.equal(ast.type, 'Sequence');
        assert.equal(normalize(stringify(ast)), normalize(syntax));
    });
}

describe('CSS syntax grammar', function() {
    it('combinator precedence', function() {
        var ast = parse('a b   |   c ||   d &&   e f');
        assert.equal(stringify(ast, true), '[ [ a b ] | [ c || [ d && [ e f ] ] ] ]');
    });

    describe('parse/stringify', function() {
        ['properties', 'syntaxes'].forEach(function(section) {
            for (var name in data[section]) {
                // odd syntax
                if (section === 'syntaxes' && name === 'an-plus-b') {
                    continue;
                }

                var info = data[section][name];
                var syntax = (info.syntax || info)
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&');

                createTest(section + '/' + name, syntax);
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
});
