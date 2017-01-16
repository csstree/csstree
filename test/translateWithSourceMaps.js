var assert = require('assert');
var parse = require('../lib/parser');
var translateWithSourceMap = require('../lib/utils/translateWithSourceMap');
var forEachParseTest = require('./fixture/parse').forEachTest;

function createTranslateWidthSourceMapTest(name, test, context) {
    it(name, function() {
        var ast = parse(test.source, {
            context: context,
            positions: true
        });

        // strings should be equal
        assert.equal(translateWithSourceMap(ast).css, 'translate' in test ? test.translate : test.source);
    });
}

describe('translateWithSourceMap', function() {
    forEachParseTest(createTranslateWidthSourceMapTest);

    it('should throws on unknown node type', function() {
        assert.throws(function() {
            translateWithSourceMap({
                type: 'xxx'
            });
        }, /Unknown node type/);
    });

    it('should generate a map', function() {
        var ast = parse('.a {\n  color: red;\n}\n', {
            filename: 'test.css',
            positions: true
        });
        var result = translateWithSourceMap(ast);

        assert.equal(result.css, '.a{color:red}');
        assert.equal(result.map.toString(), '{"version":3,"sources":["test.css"],"names":[],"mappings":"AAAA,E,CACE,S"}');
    });
});
