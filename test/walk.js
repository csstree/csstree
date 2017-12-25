var assert = require('assert');
var path = require('path');
var parse = require('../lib').parse;
var walk = require('../lib').walk;
var walkRules = require('../lib').walkRules;
var walkRulesRight = require('../lib').walkRulesRight;
var walkDeclarations = require('../lib').walkDeclarations;
var testFiles = require('./fixture/parse').tests;
var forEachParseTest = require('./fixture/parse').forEachTest;
var testWithRules = Object.keys(testFiles).map(function(filename) {
    var dir = path.basename(path.dirname(filename));
    if (dir === 'atrule' || dir === 'rule' || dir === 'stylesheet') {
        return testFiles[filename];
    };
}).filter(Boolean);

function expectedWalk(ast, enter, leave, checker) {
    function walk(node) {
        if (enter && checker(stack, node)) {
            result.push(node.type);
        }

        stack.push(node);
        Object.keys(node).forEach(function(key) {
            if (Array.isArray(node[key])) {
                node[key].forEach(walk);
            } else if (node[key] && typeof node[key] === 'object') {
                walk(node[key]);
            }
        });
        stack.pop();

        if (leave && checker(stack, node)) {
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

function createWalkTest(name, test, context, walker, enter, leave) {
    (test.skip ? it.skip : it)(name, function() {
        var actual = [];
        var ast = parse(test.source, test.options);

        walker(ast, function(node) {
            actual.push(node.type);
        });

        // type arrays should be equal
        assert.deepEqual(
            actual,
            expectedWalk(test.ast, enter, leave)
        );
    });
}

function createWalkRulesTest(test, context, walker) {
    (test.skip ? it.skip : it)(test.name, function() {
        var actual = [];
        var ast = parse(test.source, test.options);

        walker(ast, function(node) {
            actual.push(node.type);
        });

        // type arrays should be equal
        assert.deepEqual(
            actual.sort(),
            expectedWalk(test.ast, true, false).filter(function(type) {
                return type === 'Rule' || type === 'Atrule';
            }).sort()
        );
    });
}

function createWalkDeclarationsTest(test, context, walker) {
    (test.skip ? it.skip : it)(test.name, function() {
        var actual = [];
        var ast = parse(test.source, test.options);

        walker(ast, function(node) {
            actual.push(node.type);
        });

        // type arrays should be equal
        assert.deepEqual(
            actual.sort(),
            expectedWalk(test.ast, false, true, function(stack) {
                return stack.every(function(node) {
                    return node.type !== 'AtrulePrelude';
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

            walk(parse('@import url("test");@media (min-width: 200px) { .foo:nth-child(2n) { color: rgb(100%, 10%, 0%); width: calc(3px + 5%) } }'), function(node) {
                visitedTypes[node.type] = true;
            });

            return Object.keys(visitedTypes).sort();
        }

        var shouldVisitTypes = [
            'AnPlusB',
            'Atrule',
            'AtrulePrelude',
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
            'PseudoClassSelector',
            'Rule',
            'Selector',
            'SelectorList',
            'String',
            'StyleSheet',
            'Url',
            'Value',
            'WhiteSpace'
        ];

        assert.deepEqual(visit(), shouldVisitTypes);
    });

    it('base test #2', function() {
        var ast = parse('.a { color: red }');
        var log = [];

        walk(ast, {
            enter: function(node) {
                log.push('enter ' + node.type);
            },
            leave: function(node) {
                log.push('leave ' + node.type);
            }
        });

        assert.deepEqual(log, [
            'enter StyleSheet',
            'enter Rule',
            'enter SelectorList',
            'enter Selector',
            'enter ClassSelector',
            'leave ClassSelector',
            'leave Selector',
            'leave SelectorList',
            'enter Block',
            'enter Declaration',
            'enter Value',
            'enter Identifier',
            'leave Identifier',
            'leave Value',
            'leave Declaration',
            'leave Block',
            'leave Rule',
            'leave StyleSheet'
        ]);
    });

    describe('bad options', function() {
        var ast = parse('.foo { color: red }');

        it('should throws when no enter/leave handlers is set', function() {
            assert.throws(function() {
                walk(ast);
            }, /Neither `enter` nor `leave` walker handler is set or both aren't a function/);

            assert.throws(function() {
                walk(ast, {});
            }, /Neither `enter` nor `leave` walker handler is set or both aren't a function/);
        });
    });

    describe('walk all', function() {
        forEachParseTest(function(name, test, context) {
            createWalkTest(name, test, context, walk, true, false);
        });
    });

    describe('walk all (leave)', function() {
        forEachParseTest(function(name, test, context) {
            createWalkTest(name, test, context, function(ast, fn) {
                walk(ast, { leave: fn });
            }, false, true);
        });
    });

    describe('walk ruleset', function() {
        testWithRules.forEach(function(file) {
            Object.keys(file.tests).forEach(function(name) {
                createWalkRulesTest(file.tests[name], file.scope, walkRules);
            });
        });
    });

    describe('walk rulesetRight', function() {
        testWithRules.forEach(function(file) {
            Object.keys(file.tests).forEach(function(name) {
                createWalkRulesTest(file.tests[name], file.scope, walkRulesRight);
            });
        });
    });

    describe('walk declarations', function() {
        testWithRules.forEach(function(file) {
            Object.keys(file.tests).forEach(function(name) {
                createWalkDeclarationsTest(file.tests[name], file.scope, walkDeclarations);
            });
        });
    });
});
