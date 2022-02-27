import assert from 'assert';
import parse from 'css-tree/selector-parser';
import { forEachSelectorTest } from './fixture/ast.js';

const stringifyWithNoLoc = ast => JSON.stringify(ast, (key, value) => key !== 'loc' ? value : undefined, 4);

describe('parse-selector', () => {
    forEachSelectorTest((name, test) => {
        (test.skip ? it.skip : it)(name, () => {
            const ast = parse(test.source, test.options);

            // AST should be equal
            assert.strictEqual(stringifyWithNoLoc(ast), stringifyWithNoLoc(test.ast));
        });
    });
});
