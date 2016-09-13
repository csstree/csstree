var assert = require('assert');
var parse = require('../lib/parser.js');
var walkAll = require('../lib/utils/walk.js').all;
var walkRules = require('../lib/utils/walk.js').rules;
var walkRulesRight = require('../lib/utils/walk.js').rulesRight;
var testFiles = require('./fixture/parse').tests;
var forEachTest = require('./fixture/parse').forEachTest;

function expectedWalk(ast) {
    function walk(node) {
        result.push(node.type);
        for (var key in node) {
            if (key !== 'parent' && key !== 'info') {
                if (Array.isArray(node[key])) {
                    node[key].forEach(walk);
                } else if (node[key] && typeof node[key] === 'object') {
                    walk(node[key]);
                }
            }
        }
    }

    var result = [];
    walk(ast);
    return result;
}

function createWalkAllTest(name, test, context) {
    it(name, function() {
        var actual = [];
        var ast = parse(test.source, {
            context: context
        });

        walkAll(ast, function(node) {
            actual.push(node.type);
        });

        // type arrays should be equal
        assert.equal(actual.sort().join(','), expectedWalk(test.ast).sort().join(','));
    });
}

function createWalkRulesTest(name, test, context, walker) {
    it(name, function() {
        var actual = [];
        var ast = parse(test.source, {
            context: context
        });

        walker(ast, function(node) {
            actual.push(node.type);
        });

        // type arrays should be equal
        assert.equal(
            actual.sort().join(','),
            expectedWalk(test.ast).filter(function(type) {
                return type === 'Ruleset' || type === 'Atrule';
            }).sort().join(',')
        );
    });
}

describe('AST traversal', function() {
    it('base test', function() {
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
            'Class',
            'Declaration',
            'Dimension',
            'Function',
            'FunctionalPseudo',
            'Identifier',
            'Nth',
            'Operator',
            'Parentheses',
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

    describe('walk all', function() {
        forEachTest(createWalkAllTest);
    });

    describe('walk ruleset', function() {
        for (var filename in testFiles) {
            var file = testFiles[filename];

            if (filename === 'atruleb.json' ||
                filename === 'atruler.json' ||
                filename === 'atrules.json' ||
                filename === 'stylesheet.json' ||
                filename === 'ruleset.json') {
                for (var name in file.tests) {
                    createWalkRulesTest(file.locator.get(name), file.tests[name], file.scope, walkRules);
                }
            }
        };
    });

    describe('walk rulesetRight', function() {
        for (var filename in testFiles) {
            var file = testFiles[filename];

            if (filename === 'atruleb.json' ||
                filename === 'atruler.json' ||
                filename === 'atrules.json' ||
                filename === 'stylesheet.json' ||
                filename === 'ruleset.json') {
                for (var name in file.tests) {
                    createWalkRulesTest(file.locator.get(name), file.tests[name], file.scope, walkRulesRight);
                }
            }
        };
    });
});
