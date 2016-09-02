var fs = require('fs');
var assert = require('assert');
var parse = require('../lib/parser.js');
var walkAll = require('../lib/utils/walk.js').all;
var stringify = require('./helpers/stringify.js');

function normalize(str) {
    return str.replace(/\n|\r\n?|\f/g, '\n');
}

describe('Common', function() {
    it('walk', function() {
        function visit() {
            var visitedTypes = {};

            walkAll(parse('@media (min-width: 200px) { .foo:nth-child(2n) { color: rgb(100%, 10%, 0%); width: calc(3px + 5%) } }'), function(node) {
                visitedTypes[node.type] = true;
            });

            return Object.keys(visitedTypes).sort();
        }

        var shouldVisitTypes = [
            'Argument',
            'Atrule',
            'AtruleExpression',
            'Block',
            'Braces',
            'Class',
            'Declaration',
            'Dimension',
            'Function',
            'FunctionalPseudo',
            'Identifier',
            'Nth',
            'Operator',
            'Percentage',
            'Property',
            'Ruleset',
            'Selector',
            'SimpleSelector',
            'Space',
            'StyleSheet',
            'Value'
        ];

        assert.deepEqual(visit(), shouldVisitTypes);
    });

    it('JSON.strigify()', function() {
        assert.equal(
            stringify(parse('.a\n{\rcolor:\r\nred}', {
                positions: true
            }), true),
            normalize(fs.readFileSync(__dirname + '/fixture/stringify.txt', 'utf-8').trim())
        );
    });
});
