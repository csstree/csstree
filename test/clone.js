const assert = require('assert');
const {
    parse,
    clone,
    walk,
    toPlainObject
} = require('../lib');

function createCloneTest(name, getAst) {
    it(name, () => {
        const ast = getAst();
        const astCopy = clone(ast);
        const astNodes = [];
        let clonedNodeCount = 0;
        let nonClonedNodeCount = 0;

        walk(ast, node => astNodes.push(node));
        walk(astCopy, node => {
            clonedNodeCount++;
            nonClonedNodeCount += astNodes.includes(node);
        });

        assert.equal(clonedNodeCount, astNodes.length);
        assert.equal(nonClonedNodeCount, 0);
    });
}

describe('clone()', function() {
    createCloneTest('a regular AST', () =>
        parse('.test{color:red;}@media foo{div{color:green}}')
    );

    createCloneTest('an AST as JSON', () =>
        toPlainObject(
            parse('.test{color:red;}@media foo{div{color:green}}')
        )
    );
});
