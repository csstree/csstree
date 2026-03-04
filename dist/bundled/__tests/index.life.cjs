/* global csstree */
const assert = require('assert');
const path = require('path');
const fs = require('fs');

it('index.life.js', () => {
    eval(fs.readFileSync(path.resolve(__dirname, `../index.life.js`), 'utf8'));
    const ast = csstree.parse('.test { color: red }');
    const actual = csstree.generate(ast);

    assert.strictEqual(actual, '.test{color:red}');
});
