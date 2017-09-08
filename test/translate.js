var assert = require('assert');
var parse = require('../lib').parse;
var translate = require('../lib').translate;
var forEachParseTest = require('./fixture/parse').forEachTest;
var stringify = require('./helpers/stringify');

function createTranslateTest(name, test) {
    (test.skip ? it.skip : it)(name, function() {
        var ast = parse(test.source, test.options);
        var restoredCss = translate(ast);

        // strings should be equal
        assert.equal(restoredCss, 'translate' in test ? test.translate : test.source);

        // FIXME: Skip some test cases for round-trip check until generator's improvements
        if (/block at-rule #c\.2|atruler\.c\.2|parentheses\.c\.3/.test(name)) {
            return;
        }

        // https://drafts.csswg.org/css-syntax/#serialization
        // The only requirement for serialization is that it must "round-trip" with parsing,
        // that is, parsing the stylesheet must produce the same data structures as parsing,
        // serializing, and parsing again, except for consecutive <whitespace-token>s,
        // which may be collapsed into a single token.
        assert.equal(
            stringify(parse(restoredCss, test.options)),
            stringify(ast)
        );
    });
}

describe('translate', function() {
    forEachParseTest(createTranslateTest);

    it('should throws on unknown node type', function() {
        assert.throws(function() {
            translate({
                type: 'xxx'
            });
        }, /Unknown node type/);
    });
});
