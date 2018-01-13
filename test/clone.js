var assert = require('assert');
var parse = require('../lib').parse;
var clone = require('../lib').clone;
var walk = require('../lib').walk;
var toPlainObject = require('../lib').toPlainObject;

function createCloneTest(name, getAst) {
    it(name, function() {
        var ast = getAst();
        var astCopy = clone(ast);
        var astNodes = [];
        var clonedNodeCount = 0;
        var nonClonedNodeCount = 0;

        walk(ast, function(node) {
            astNodes.push(node);
        });

        walk(astCopy, function(node) {
            clonedNodeCount++;
            if (astNodes.indexOf(node) !== -1) {
                nonClonedNodeCount++;
            }
        });

        assert.equal(clonedNodeCount, astNodes.length);
        assert.equal(nonClonedNodeCount, 0);
    });
}

describe('clone()', function() {
    createCloneTest('a regular AST', function() {
        return parse('.test{color:red;}@media foo{div{color:green}}');
    });

    createCloneTest('an AST as JSON', function() {
        return toPlainObject(
            parse('.test{color:red;}@media foo{div{color:green}}')
        );
    });
});
