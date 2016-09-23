var path = require('path');
var assert = require('assert');
var parse = require('../lib/parser');
var walkAll = require('../lib/utils/walk').all;
var translate = require('../lib/utils/translate');
var JsonLocator = require('./helpers/JsonLocator');
var forEachParseTest = require('./fixture/parse').forEachTest;
var stringify = require('./helpers/stringify');

function createParseErrorTest(location, test, options) {
    it(location + ' ' + JSON.stringify(test.css), function() {
        var error;

        assert.throws(function() {
            parse(test.css, options);
        }, function(e) {
            error = e;
            if (e.parseError) {
                return true;
            }
        }, 'Should be CSS parse error');

        assert.equal(error.message, test.error);
        assert.deepEqual(error.parseError, test.position);
    });
}

describe('parse', function() {
    forEachParseTest(function createParseTest(name, test, context) {
        it(name, function() {
            var ast = parse(test.source, {
                context: context
            });

            // AST should be equal
            assert.equal(stringify(ast), stringify(test.ast));

            // translated AST should be equal to original source
            assert.equal(translate(ast), 'translate' in test ? test.translate : test.source);
        });
    });
});

describe('parse error', function() {
    var filename = __dirname + '/fixture/parse-errors.json';
    var tests = require(filename);
    var locator = new JsonLocator(filename);

    filename = path.relative(__dirname + '/..', filename);

    for (var key in tests) {
        tests[key].name = locator.get(key);
    }

    tests.forEach(function(test) {
        createParseErrorTest(filename, test);
        createParseErrorTest(filename + ' (with positions)', test, {
            positions: true
        });
    });
});

describe('positions', function() {
    it('should start with line 1 column 1 by default', function() {
        var ast = parse('.foo.bar {\n  property: value 123 123.4 .123 123px 99% #fff url( a ) / var( --a ), "test" \'test\';\n}', {
            positions: true
        });
        var positions = [];

        walkAll(ast, function(node) {
            if (node.info) {
                positions.unshift([node.info.line, node.info.column, node.type]);
            }
        });

        assert.deepEqual(positions, [
            [1, 1, 'StyleSheet'],
            [1, 1, 'Rule'],
            [1, 10, 'Block'],
            [2, 3, 'Declaration'],
            [2, 12, 'Value'],
            [2, 79, 'String'],
            [2, 72, 'String'],
            [2, 70, 'Operator'],
            [2, 60, 'Function'],
            [2, 65, 'Identifier'],
            [2, 58, 'Operator'],
            [2, 49, 'Url'],
            [2, 54, 'Raw'],
            [2, 44, 'Hash'],
            [2, 40, 'Percentage'],
            [2, 34, 'Dimension'],
            [2, 29, 'Number'],
            [2, 23, 'Number'],
            [2, 19, 'Number'],
            [2, 13, 'Identifier'],
            [1, 1, 'Selector'],
            [1, 1, 'SimpleSelector'],
            [1, 5, 'Class'],
            [1, 1, 'Class']
        ]);
    });

    it('should start with specified line and column', function() {
        var ast = parse('.foo.bar {\n  property: value 123 123.4 .123 123px 99% #fff url( a ) / var( --a ), "test" \'test\';\n}', {
            positions: true,
            line: 3,
            column: 5
        });
        var positions = [];

        walkAll(ast, function(node) {
            if (node.info) {
                positions.unshift([node.info.line, node.info.column, node.type]);
            }
        });

        assert.deepEqual(positions, [
            [3, 5, 'StyleSheet'],
            [3, 5, 'Rule'],
            [3, 14, 'Block'],
            [4, 3, 'Declaration'],
            [4, 12, 'Value'],
            [4, 79, 'String'],
            [4, 72, 'String'],
            [4, 70, 'Operator'],
            [4, 60, 'Function'],
            [4, 65, 'Identifier'],
            [4, 58, 'Operator'],
            [4, 49, 'Url'],
            [4, 54, 'Raw'],
            [4, 44, 'Hash'],
            [4, 40, 'Percentage'],
            [4, 34, 'Dimension'],
            [4, 29, 'Number'],
            [4, 23, 'Number'],
            [4, 19, 'Number'],
            [4, 13, 'Identifier'],
            [3, 5, 'Selector'],
            [3, 5, 'SimpleSelector'],
            [3, 9, 'Class'],
            [3, 5, 'Class']
        ]);
    });
});
