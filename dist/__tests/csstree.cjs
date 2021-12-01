/* global csstree */
const assert = require('assert');
const fs = require('fs');

it('csstree.js', () => {
    eval(fs.readFileSync('dist/csstree.js', 'utf8'));
    const ast = csstree.parse('.test { color: red }');
    const actual = csstree.generate(ast);

    assert.strictEqual(actual, '.test{color:red}');
});
