import assert from 'assert';
import { parse, generate } from '../csstree.esm.js';

it('csstree.esm.js', () => {
    const ast = parse('.test { color: red }');
    const actual = generate(ast);

    assert.strictEqual(actual, '.test{color:red}');
});
