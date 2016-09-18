var assert = require('assert');
var parse = require('../lib/parser');
var clone = require('../lib/utils/clone');
var walkAll = require('../lib/utils/walk').all;

function sumMarker(ast) {
    var result = 0;

    walkAll(ast, function(node) {
        result += node.marker;
    });

    return result;
}

describe('AST clone', function() {
    it('clone()', function() {
        var ast = parse('.test{color:red;}@media foo{div{color:green}}');
        var astCopy = clone(ast);

        walkAll(ast, function(node) {
            node.marker = 1;
        });

        walkAll(astCopy, function(node) {
            node.marker = 2;
        });

        assert(sumMarker(ast) > 1);
        assert.equal(sumMarker(ast) * 2, sumMarker(astCopy));
    });
});
