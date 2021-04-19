const assert = require('assert');
const { parse, generate, fromPlainObject, toPlainObject } = require('./helpers/lib');
const css = '.test{a:123}';

describe('convert', () => {
    it('fromPlainObject', () => {
        const ast = parse(css);
        const plainObject = JSON.parse(JSON.stringify(ast));
        const actual = generate(fromPlainObject(plainObject));

        assert.strictEqual(actual, css);
    });

    it('toPlainObject', () => {
        const ast = parse(css);
        const expected = JSON.parse(JSON.stringify(ast));
        const actual = toPlainObject(ast);

        assert.deepStrictEqual(actual, expected);
    });
});
