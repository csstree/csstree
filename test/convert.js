var assert = require('assert');
var csstree = require('../lib');
var parse = csstree.parse;
var translate = csstree.translate;
var fromPlainObject = csstree.fromPlainObject;
var toPlainObject = csstree.toPlainObject;
var css = '.test{a:123}';

describe('convert', function() {
    it('fromPlainObject', function() {
        var ast = parse(css);
        var plainObject = JSON.parse(JSON.stringify(ast));

        assert.equal(
            translate(fromPlainObject(plainObject)),
            css
        );
    });

    it('toPlainObject', function() {
        var ast = parse(css);

        assert.deepEqual(
            toPlainObject(ast),
            JSON.parse(JSON.stringify(ast))
        );
    });
});
