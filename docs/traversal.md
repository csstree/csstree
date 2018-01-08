# AST traversal

## Basic example

```js
var csstree = require('css-tree');
var ast = csstree.parse('.a { color: red; }');

csstree.walk(ast, function(node) {
    console.log(node.type);
});
// StyleSheet
// Rule
// SelectorList
// Selector
// ClassSelector
// Block
// Declaration
// Value
// Identifier
```

## walk(ast, handler)

Visits each node of AST in a natural way and calls a handler for each one.

```js
// collect all urls in declarations
var csstree = require('css-tree');
var urls = [];
var ast = csstree.parse(`
    @import url(import.css);
    .foo { background: url('foo.jpg'); }
    .bar { background-image: url(bar.png); }
`);

csstree.walk(ast, function(node) {
    if (this.declaration !== null && node.type === 'Url') {
        var value = node.value;

        if (value.type === 'Raw') {
            urls.push(value.value);
        } else {
            urls.push(value.value.substr(1, value.value.length - 2));
        }
    }
});

console.log(urls);
// [ 'foo.jpg', 'bar.png' ]
```

Options (optional):

<!-- MarkdownTOC -->

- [enter](#enter)
- [leave](#leave)
- [visit](#visit)
- [reverse](#reverse)

<!-- /MarkdownTOC -->

## enter

Type: `function` or `undefined`  
Default: `undefined`

Handler on node entrance, i.e. before any nested node is processed.

```js
var csstree = require('css-tree');
var ast = csstree.parse('.a { color: red; }');

csstree.walk(ast, {
    enter: function(node) {
        console.log(node.type);
    }
});
// StyleSheet
// Rule
// SelectorList
// Selector
// ClassSelector
// Block
// Declaration
// Value
// Identifier
```

Handler receives a three arguments. The first one is `node` – the AST node a walker entering to. The second two arguments are depend on type of `children`, i.e. is it an array or a list. When `children` is an array, those arguments are `index` and `array`, like for `Array#forEach()` or `Array#map()` methods. When `children` is a list those arguments are:
- `item` – node wrapper, that contains references to `prev` and `next` nodes in a list, and `data` reference for the node
- `list` – is a reference to the list; it's useful for list operations like `remove()` or `insert()`

Context (`this`) for handler is an object with a references to the closest ancestor nodes:

- `root` – refers to AST root node (actually it's a node passed to `walk()` method)
- `stylesheet` – refers to `StyleSheet` node, usually it's a root node
- `atrule` – refers to closest `Atrule` node if any
- `atrulePrelude` – refers to `AtrulePrelude` node if any
- `rule` – refers to closest `Rule` node if any
- `selector` – refers to `SelectorList` node if any
- `block` - refers to closest `Block` node if any
- `declaration` – refers to `Declaration` node if any
- `function` – refers to closest `Function`, `PseudoClassSelector` or `PseudoElementSelector` node if current node inside one of them

## leave

Type: `function` or `undefined`  
Default: `undefined`

The same as `enter` handler but invokes on node exit, i.e. after all nested nodes are processed.

```js
var csstree = require('css-tree');
var ast = csstree.parse('.a { color: red; }');

csstree.walk(ast, {
    enter: function(node) {
        console.log(node.type);
    }
});
// StyleSheet
// Rule
// SelectorList
// Selector
// ClassSelector
// Block
// Declaration
// Value
// Identifier

csstree.walk(ast, {
    leave: function(node) {
        console.log(node.type);
    }
});
// ClassSelector
// Selector
// SelectorList
// Identifier
// Value
// Declaration
// Block
// Rule
// StyleSheet
```

## visit

Type: `'Rule'`, `'Atrule'`, `'Declaration'` or `null`  
Default: `null`

Invokes nodes of specified type. It helps avoid extra checks and performs faster, because some subtrees may to be skipped since they can't contain a node of specified type.

## reverse

Type: `boolean`  
Default: `false`

Iterate children nodes in reverse order (from last to first).
