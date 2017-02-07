var assert = require('assert');
var path = require('path');
var parse = require('../lib/parser');
var walkAll = require('../lib/utils/walk').all;
var walkAllUp = require('../lib/utils/walk').allUp;
var walkRules = require('../lib/utils/walk').rules;
var walkRulesRight = require('../lib/utils/walk').rulesRight;
var walkDeclarations = require('../lib/utils/walk').declarations;
var testFiles = require('./fixture/parse').tests;
var forEachParseTest = require('./fixture/parse').forEachTest;
var testWithRules = Object.keys(testFiles).map(function(filename) {
    var dir = path.basename(path.dirname(filename));
    if (dir === 'atrule' || dir === 'rule' || dir === 'stylesheet') {
        return testFiles[filename];
    };
}).filter(Boolean);

function expectedWalk(ast, right, checker) {
    function walk(node) {
        if (right && checker(stack, node)) {
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

        if (!right && checker(stack, node)) {
            result.push(node.type);
        }
    }

    var result = [];
    var stack = [];

    if (!checker) {
        checker = Boolean;
    }

    walk(ast);

    return result;
}

function createWalkTest(name, test, context, walker, right) {
    it(name, function() {
        var actual = [];
        var ast = parse(test.source, test.options);

        walker(ast, function(node) {
            actual.push(node.type);
        });

        // type arrays should be equal
        assert.deepEqual(
            actual.sort(),
            expectedWalk(test.ast, right).sort()
        );
    });
}

function createWalkRulesTest(test, context, walker) {
    it(test.name, function() {
        var actual = [];
        var ast = parse(test.source, test.options);

        walker(ast, function(node) {
            actual.push(node.type);
        });

        // type arrays should be equal
        assert.deepEqual(
            actual.sort(),
            expectedWalk(test.ast, true).filter(function(type) {
                return type === 'Rule' || type === 'Atrule';
            }).sort()
        );
    });
}

function createWalkDeclarationsTest(test, context, walker) {
    it(test.name, function() {
        var actual = [];
        var ast = parse(test.source, test.options);

        walker(ast, function(node) {
            actual.push(node.type);
        });

        // type arrays should be equal
        assert.deepEqual(
            actual.sort(),
            expectedWalk(test.ast, false, function(stack) {
                return stack.every(function(node) {
                    return node.type !== 'AtruleExpression';
                });
            }).filter(function(type) {
                return type === 'Declaration';
            }).sort()
        );
    });
}

describe('AST traversal', function() {
    it('base test', function() {
        function visit() {
            var visitedTypes = {};

            walkAll(parse('@import url("test");@media (min-width: 200px) { .foo:nth-child(2n) { color: rgb(100%, 10%, 0%); width: calc(3px + 5%) } }'), function(node) {
                visitedTypes[node.type] = true;
            });

            return Object.keys(visitedTypes).sort();
        }

        var shouldVisitTypes = [
            'An+B',
            'Atrule',
            'AtruleExpression',
            'Block',
            'ClassSelector',
            'Declaration',
            'Dimension',
            'Function',
            'MediaFeature',
            'MediaQuery',
            'MediaQueryList',
            'Nth',
            'Operator',
            'Percentage',
            'PseudoClass',
            'Rule',
            'Selector',
            'SelectorList',
            'Space',
            'String',
            'StyleSheet',
            'Url',
            'Value'
        ];

        assert.deepEqual(visit(), shouldVisitTypes);
    });

    describe('walk all', function() {
        forEachParseTest(function(name, test, context) {
            createWalkTest(name, test, context, walkAll, false);
        });
    });

    describe('walk allUp', function() {
        forEachParseTest(function(name, test, context) {
            createWalkTest(name, test, context, walkAllUp, true);
        });
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
