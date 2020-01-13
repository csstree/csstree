const assert = require('assert');
const { parse, find, findLast, findAll } = require('./helpers/lib');
const ast = parse(`
    .foo { color: red; background: green; }
    .bar, .qux.foo { font-weight: bold; color: blue; }
`);
const firstFoo = ast
    .children.first    // Rule
    .prelude           // SelectorList
    .children.first    // Selector
    .children.first;   // ClassSelector
const lastFoo = ast
    .children.last     // Rule
    .prelude           // SelectorList
    .children.last     // Selector
    .children.last;    // ClassSelector

describe('Search', () => {
    describe('find', () => {
        it('base', () => {
            const actual = find(ast, node =>
                node.type === 'ClassSelector' && node.name === 'foo'
            );

            assert.equal(actual, firstFoo);
        });

        it('using refs', () => {
            const actual = find(ast, (node, item, list) =>
                node.type === 'ClassSelector' && node.name === 'foo' && list.head !== item
            );

            assert.equal(actual, lastFoo);
        });

        it('using context', () => {
            const actual = find(ast, function(node) {
                return (
                    node.type === 'ClassSelector' &&
                    node.name === 'foo' &&
                    this.selector.children.head !== this.selector.children.tail
                );
            });

            assert.equal(actual, lastFoo);
        });
    });

    describe('findLast', () => {
        it('findLast', () => {
            const actual = findLast(ast, node =>
                node.type === 'ClassSelector' && node.name === 'foo'
            );

            assert.equal(actual, lastFoo);
        });

        it('using refs', () => {
            const actual = findLast(ast, (node, item, list) =>
                node.type === 'ClassSelector' && node.name === 'foo' && list.head === item
            );

            assert.equal(actual, firstFoo);
        });

        it('using context', () => {
            const actual = findLast(ast, function(node) {
                return (
                    node.type === 'ClassSelector' &&
                    node.name === 'foo' &&
                    this.selector.children.head === this.selector.children.tail
                );
            });

            assert.equal(actual, firstFoo);
        });
    });

    it('findAll', () => {
        const actual = findAll(ast, node =>
            node.type === 'ClassSelector' && node.name === 'foo'
        );

        assert.equal(actual.length, 2);
        assert.equal(actual[0], firstFoo);
        assert.equal(actual[1], lastFoo);
    });
});
