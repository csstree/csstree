var assert = require('assert');
var parse = require('../lib/parser.js');
var translate = require('../lib/utils/translate.js');
var forEachTest = require('./fixture/parse').forEachTest;

function createTranslateTest(name, test, context) {
    it(name, function() {
        var ast = parse(test.source, {
            context: context
        });

        // strings should be equal
        assert.equal(translate(ast), 'translate' in test ? test.translate : test.source);
    });
}

describe('translate', function() {
    forEachTest(createTranslateTest);

    it('should throws on unknown node type', function() {
        assert.throws(function() {
            translate({
                type: 'xxx'
            });
        }, /Unknown node type/);
    });
});
