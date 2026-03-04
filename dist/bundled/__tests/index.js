import assert from 'assert';
import { parse, generate } from '../index.js';

it('index.js', () => {
    const ast = parse('.test { color: red }');
    const actual = generate(ast);

    assert.strictEqual(actual, '.test{color:red}');
});
