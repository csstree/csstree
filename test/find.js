var assert = require('assert');
var parse = require('../lib').parse;
var find = require('../lib').find;
var findLast = require('../lib').findLast;
var findAll = require('../lib').findAll;
var ast = parse([
    '.foo { color: red; background: green; }',
    '.bar, .qux.foo { font-weight: bold; color: blue; }'
].join(''));
var firstFoo = ast
    .children.first    // Rule
    .prelude           // SelectorList
    .children.first    // Selector
    .children.first;   // ClassSelector
var lastFoo = ast
    .children.last     // Rule
    .prelude           // SelectorList
    .children.last     // Selector
    .children.last;    // ClassSelector

describe('Search', function() {
    describe('find', function() {
        it('base', function() {
            var actual = find(ast, function(node) {
                return node.type === 'ClassSelector' && node.name === 'foo';
            });

            assert.equal(actual, firstFoo);
        });

        it('using refs', function() {
            var actual = find(ast, function(node, item, list) {
                return node.type === 'ClassSelector' && node.name === 'foo' && list.head !== item;
            });

            assert.equal(actual, lastFoo);
        });

        it('using context', function() {
            var actual = find(ast, function(node) {
                return node.type === 'ClassSelector' && node.name === 'foo' && this.selector.children.head !== this.selector.children.tail;
            });

            assert.equal(actual, lastFoo);
        });
    });

    describe('findLast', function() {
        it('findLast', function() {
            var actual = findLast(ast, function(node) {
                return node.type === 'ClassSelector' && node.name === 'foo';
            });

            assert.equal(actual, lastFoo);
        });

        it('using refs', function() {
            var actual = findLast(ast, function(node, item, list) {
                return node.type === 'ClassSelector' && node.name === 'foo' && list.head === item;
            });

            assert.equal(actual, firstFoo);
        });

        it('using context', function() {
            var actual = findLast(ast, function(node) {
                return node.type === 'ClassSelector' && node.name === 'foo' && this.selector.children.head === this.selector.children.tail;
            });

            assert.equal(actual, firstFoo);
        });
    });

    it('findAll', function() {
        var actual = findAll(ast, function(node) {
            return node.type === 'ClassSelector' && node.name === 'foo';
        });

        assert.equal(actual.length, 2);
        assert.equal(actual[0], firstFoo);
        assert.equal(actual[1], lastFoo);
    });
});
