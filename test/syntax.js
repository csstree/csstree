var assert = require('assert');
var parseCss = require('../lib/parser.js');
// var stringifyCss = require('./helpers/stringify');
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

function createMatchTest(name, syntax, test) {
    // temporary solution to make tests correct
    if ('error' in test) {
        if (typeof test.error !== 'string') {
            throw new Error(name + ' – error field should be a string');
        }
    } else if ('match' in test) {
        if (test.match !== true) {
            throw new Error(name + ' – match field should be a true');
        }
    }

    it(name, function() {
        var css = parseCss(test.value, { context: 'value' });

        if (test.error) {
            assert.throws(function() {
                syntax.match('test', css);
            }, new RegExp('^Error: ' + test.error));
        } else {
            // left it for future
            // assert.equal(
            //     stringifyCss(syntax.match('test', css)),
            //     stringifyCss(test.match)
            // );

            assert(Boolean(syntax.match('test', css)));
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

    describe.only('match', function() {
        tests.forEachTest(createMatchTest);
    });
});
