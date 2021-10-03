import assert from 'assert';
import {
    parse,
    clone,
    walk,
    toPlainObject
} from 'css-tree';

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

        assert.strictEqual(clonedNodeCount, astNodes.length);
        assert.strictEqual(nonClonedNodeCount, 0);
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
