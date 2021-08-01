import assert from 'assert';
import importLib from './helpers/lib.js';

describe('clone()', async () => {
    const { parse, clone, walk, toPlainObject } = await importLib();

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

    createCloneTest('a regular AST', () =>
        parse('.test{color:red;}@media foo{div{color:green}}')
    );

    createCloneTest('an AST as JSON', () =>
        toPlainObject(
            parse('.test{color:red;}@media foo{div{color:green}}')
        )
    );
});
