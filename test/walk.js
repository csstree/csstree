var assert = require('assert');
var path = require('path');
var parse = require('../lib/parser');
var walkAll = require('../lib/utils/walk').all;
var walkRules = require('../lib/utils/walk').rules;
var walkRulesRight = require('../lib/utils/walk').rulesRight;
var walkDeclarations = require('../lib/utils/walk').declarations;
var testFiles = require('./fixture/parse').tests;
var forEachTest = require('./fixture/parse').forEachTest;
var testWithRules = Object.keys(testFiles).map(function(filename) {
    var dir = path.basename(path.dirname(filename));
    if (dir === 'atrule' || dir === 'ruleset' || dir === 'stylesheet') {
        return testFiles[filename];
    };
}).filter(Boolean);

function expectedWalk(ast, checker) {
    function walk(node) {
        if (checker(stack, node)) {
            result.push(node.type);
        }

        stack.push(node);
        for (var key in node) {
            if (Array.isArray(node[key])) {
                node[key].forEach(walk);
            } else if (node[key] && typeof node[key] === 'object') {
                walk(node[key]);
            }
        }
        stack.pop();
    }

    var result = [];
    var stack = [];

    if (!checker) {
        checker = Boolean;
    }

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

function createWalkRulesTest(test, context, walker) {
    it(test.name, function() {
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

function createWalkDeclarationsTest(test, context, walker) {
    it(test.name, function() {
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
            expectedWalk(test.ast, function(stack, node) {
                return node.type === 'Declaration' && stack.some(function(node) {
                    return node.type === 'Ruleset';
                });
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
        testWithRules.forEach(function(file) {
            for (var name in file.tests) {
                createWalkRulesTest(file.tests[name], file.scope, walkRules);
            }
        });
    });

    describe('walk rulesetRight', function() {
        testWithRules.forEach(function(file) {
            for (var name in file.tests) {
                createWalkRulesTest(file.tests[name], file.scope, walkRulesRight);
            }
        });
    });

    describe('walk declarations', function() {
        testWithRules.forEach(function(file) {
            for (var name in file.tests) {
                createWalkDeclarationsTest(file.tests[name], file.scope, walkDeclarations);
            }
        });
    });
});
