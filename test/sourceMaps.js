var assert = require('assert');
var parse = require('../lib/parser.js');
var translateWithSourceMap = require('../lib/utils/translateWithSourceMap.js');
var forEachTest = require('./fixture/parse').forEachTest;

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
    forEachTest(createTranslateWidthSourceMapTest);
});
