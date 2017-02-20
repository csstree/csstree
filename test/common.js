var fs = require('fs');
var path = require('path');
var assert = require('assert');
var parse = require('../lib/parser');
var walk = require('../lib/walker').all;
var stringify = require('./helpers/stringify.js');
var css = '/fixture/stringify.css';
var types = [
    'AnPlusB', 'Atrule', 'AtruleExpression', 'AttributeSelector', 'Block', 'Brackets',
    'ClassSelector', 'Combinator', 'Comment', 'Declaration', 'Dimension', 'Function',
    'HexColor', 'IdSelector', 'Identifier', 'Nth', 'MediaFeature', 'MediaQuery', 'MediaQueryList',
    'Number', 'Operator', 'Parentheses', 'Percentage', 'PseudoClassSelector',
    'PseudoElementSelector', 'Ratio', 'Raw', 'Rule', 'Selector', 'SelectorList', 'WhiteSpace',
    'String', 'StyleSheet', 'TypeSelector', 'UnicodeRange', 'Url', 'Value'
];

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

describe('Common', function() {
    var cssStr;
    var ast;

    before(function() {
        cssStr = normalize(fs.readFileSync(__dirname + css, 'utf-8'));
        ast = parse(cssStr, {
            filename: path.basename(css),
            positions: true
        });

        // fs.writeFileSync(__dirname + '/fixture/stringify.ast', stringify(ast, true) + '\n', 'utf-8');
    });

    it('utils.strigify()', function() {
        assert.equal(
            stringify(ast, true),
            normalize(fs.readFileSync(__dirname + '/fixture/stringify.ast', 'utf-8').trim())
        );
    });

    it('test CSS should contain all node types', function() {
        var foundTypes = Object.create(null);

        walk(ast, function(node) {
            foundTypes[node.type] = true;
        });

        assert.deepEqual(
            Object.keys(foundTypes).sort(),
            types.sort()
        );
    });
});
