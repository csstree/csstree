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

Visits each node of AST in natural way and calls one or two handlers for each one. 

```js
// collect all urls in declarations
var csstree = require('./lib/index.js');
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

Handler on node entrance, i.e. before nested nodes are processed. Handler receives three arguments:

- `node` – current AST node
- `item` – node wrapper when node is a list member; this wrapper contains references to `prev` and `next` nodes in list
- `list` – reference to list when node is a list member; it's useful for operations on list like `remove()` or `insert()`

Context for handler an object, that contains references to some parent nodes:

- `root` – refers to `ast` root node (actually it's a node passed to walker function)
- `stylesheet` – refers to `StyleSheet` node, usually it's a root node
- `atrulePrelude` – refers to `AtrulePrelude` node if any
- `rule` – refers to closest `Rule` node if any
- `selector` – refers to `SelectorList` node if any
- `block` - refers to closest `Block` node if any
- `declaration` – refers to `Declaration` node if any
- `function` – refers to closest `Function`, `PseudoClassSelector` or `PseudoElementSelector` node if current node inside one of them

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

## leave

Type: `function` or `undefined`  
Default: `undefined`

The same as `enter` handler but on node exit, i.e. after nested nodes are processed.

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

Invokes nodes of specified type. It helps avoid extra checks and performs faster, because some subtrees may to be skipped since can't contain a node of specified type.

## reverse

Type: `boolean`  
Default: `false`

Iterate children node in reverse order (from last to first).
