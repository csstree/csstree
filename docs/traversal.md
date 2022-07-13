# AST traversal

- [walk(ast, options)](#walkast-options)
- [find(ast, fn)](#findast-fn)
- [findLast(ast, fn)](#findlastast-fn)
- [findAll(ast, fn)](#findallast-fn)

## walk(ast, options)

Method visits each node of passed AST in a natural way and calls handlers for each one. It takes two arguments: a root node (`ast`) and an object (`options`). In simple case, it may take a function (handler) instead of `options` (`walk(ast, fn)` is equivalent to `walk(ast, { enter: fn })`).

```js
import { parse, walk } from 'css-tree';

const ast = parse('.a { color: red; }');

walk(ast, function(node) {
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

How it works:

- Method uses `structure` field value of every node type to define the way how to iterate node's properties:
    - A function-iterator is generating for every node type.
    - Node's properties are iterated in the order as defined in `structure` ([reverse](#reverse) option inverts the order).
    - Properties that are not defined in `structure` are ignored (won't be iterated over).
    - An exception is possible when a tree is not following to expected structure (e.g. AST was built outside the CSSTree parser or transformed in a wrong way). In case you are not sure about correctness of the tree structure, you may use `try/catch` or check the tree structure with `csstree.lexer.checkStructure(ast)` before iterating.
- Only `children` field may contain a list of nested nodes. A list of nodes should a `List` instances. Since `List` class provides API similar to `Array`, traversal may work in cases when `children` is an array, but without any guarantee. Using arrays in AST is not recommended, use it on your own risk.

Walk visitor's function may return special values to control traversal:
- `walk.break` or `this.break` – stops traversal, i.e. no visitor function will be invoked once this value is returned by a visitor;
- `walk.skip` or `this.skip` – prevent current node from being iterated, i.e. no visitor function will be invoked for its properties or children nodes; note that this value only has an effect for `enter` visitor as `leave` visitor invokes after iterating over all node's properties and children.

> NOTE: `walk.break` and `walk.skip` are only possible option for arrow functions, since such functions don't have their own `this`.

```js
csstree.walk(ast, {
    enter(node) {
        if (node.type === 'Block') {
            return this.skip;
        }

        if (node.name === 'foo') {
            return this.break;
        }
    },
    leave: node => node.name === 'bar' ? csstree.walk.break : false
});
```

Options:

- [enter](#enter)
- [leave](#leave)
- [visit](#visit)
- [reverse](#reverse)

### enter

Type: `function` or `undefined`  
Default: `undefined`

Handler on node entrance, i.e. before any nested node is processed.

```js
import { parse, walk } from 'css-tree';

const ast = parse('.a { color: red; }');

walk(ast, {
    enter(node) {
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

In case `options` has a single `enter` field, it can be replaced for the handler passed as a value for `enter`, i.e. `walk(ast, { enter: fn })` → `walk(ast, fn)`.

Handler receives three arguments:
- `node` – the AST node a walker entering to
- `item` – node wrapper, that contains references to `prev` and `next` nodes in a list, and `data` reference for the node
- `list` – is a reference for the list; it's useful for list operations like `remove()` or `insert()`

> NOTE: If `children` is an array, the last two arguments are `index` and `array`, like for `Array#forEach()` or `Array#map()` methods.

```js
import { parse, walk, generate } from 'css-tree';

const ast = parse(`
    .a { foo: 1; bar: 2; }
    .b { bar: 3; baz: 4; }
`);

// remove declarations with `bar` property from the tree
walk(ast, (node, item, list) => {
    if (node.type === 'Declaration' && node.property === 'bar' && list) {
        // remove a declaration from a list it
        list.remove(item);
    }
});

console.log(generate(ast));
// .a{foo:1}.b{baz:4}
```

> NOTE:
> - `item` and `list` are not defined for nodes that are not in a list. Even `Declaration` can be outside any list in case it is a root of tree or a part of `@supports` prelude, e.g. `@supports (bar: 123) { ... }`. Therefore, it's recommended to check `item` or `list` are defined before using of it (those values both are defined or both are undefined, so it's enough to test one of them)
> - Only `List` instances are safe for tree transformations such as node removal. In case you perform such operations, you can ensure that all `children` in a tree is a `List` instances by calling `csstree.fromPlainObject(ast)` before traversal.
> - It's better to use `visit` option when possible to reach better performance

Context (`this`) for a handler is an object with a references to the closest ancestor nodes:

- `root` – refers to AST root node (actually it's a node passed to `walk()` method)
- `stylesheet` – refers to `StyleSheet` node, usually it's a root node
- `atrule` – refers to closest `Atrule` node if any
- `atrulePrelude` – refers to `AtrulePrelude` node if any
- `rule` – refers to closest `Rule` node if any
- `selector` – refers to `SelectorList` node if any
- `block` - refers to closest `Block` node if any
- `declaration` – refers to `Declaration` node if any
- `function` – refers to closest `Function`, `PseudoClassSelector` or `PseudoElementSelector` node if current node inside one of them

```js
import { parse, walk } from 'css-tree';

const ast = parse(`
    @import url(import.css);
    .foo { background: url('foo.jpg'); }
    .bar { background-image: url(bar.png); }
`);

// collect all urls in declarations
const urls = [];

walk(ast, function(node) {
    if (this.declaration !== null && node.type === 'Url') {
        urls.push(node.value);
    }
});

console.log(urls);
// [ 'foo.jpg', 'bar.png' ]
```

### leave

Type: `function` or `undefined`  
Default: `undefined`

The same as `enter` handler but invokes on node exit, i.e. after all nested nodes are processed.

```js
import { parse, walk } from 'css-tree';

const ast = parse('.a { color: red; }');

walk(ast, {
    leave(node) {
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

### visit

Type: `string` or `null`  
Default: `null`

Invokes a handler for a specified node type only.

```js
import { parse, walk } from 'css-tree';

const ast = parse('.a { color: red; } .b { color: green; }');

walk(ast, {
    visit: 'ClassSelector',
    enter(node) {
        console.log(node.name);
    }
});

// example above is equivalent to
walk(ast, {
    enter(node) {
        if (node.type === 'ClassSelector') {
            console.log(node.name);
        }
    }
});
```

The traversal for some node types can perform faster (10-15 times depending on the CSS structure), because some subtrees may to be skipped since they can't contain a node of specified type (e.g. `Rule` can't be used inside of `Declaration`, so declaration's subtree can be excluded from traversal path). Fast traversal is supported for node types:

- `Atrule`
- `Rule`
- `Declaration`

> NOTE: When fast traversal is applied, some nodes may not be reached in case of an incorrect location in the tree. That's may happen if AST was built outside the CSSTree parser or transformed in a wrong way. If you need to be 100% sure that every node of type will be visited (even in wrong position), don't use `visit` option and test node type by your own.

### reverse

Type: `boolean`  
Default: `false`

Inverts the natural order of node traversing:
- node's properties are iterated in reverse order to the node's `structure` definition
- children nodes are iterated from last to first

```js
import * as csstree from 'css-tree';

const ast = csstree.parse('.a { color: red; }');

csstree.walk(ast, {
    enter(node) {
        console.log(`enter ${node.type}`);
    },
    leave(node) {
        console.log(`leave ${node.type}`);
    }
});
// enter StyleSheet
// enter Rule
// enter SelectorList
// enter Selector
// enter ClassSelector
// leave ClassSelector
// leave Selector
// leave SelectorList
// enter Block
// enter Declaration
// enter Value
// enter Identifier
// leave Identifier
// leave Value
// leave Declaration
// leave Block
// leave Rule
// leave StyleSheet

csstree.walk(ast, {
    reverse: true,    // !!!
    enter(node) {
        console.log(`enter ${node.type}`);
    },
    leave(node) {
        console.log(`leave ${node.type}`);
    }
});
// enter StyleSheet
// enter Rule
// enter Block
// enter Declaration
// enter Value
// enter Identifier
// leave Identifier
// leave Value
// leave Declaration
// leave Block
// enter SelectorList
// enter Selector
// enter ClassSelector
// leave ClassSelector
// leave Selector
// leave SelectorList
// leave Rule
// leave StyleSheet
```

## find(ast, fn)

Returns the first node in natural order for which `fn` function returns a truthy value.

```js
import * as csstree from 'css-tree';

const ast = csstree.parse('.a { color: red; } .b { color: green; }');

const firstColorDeclaration = csstree.find(ast, (node, item, list) =>
    node.type === 'Declaration' && node.property === 'color'
);

console.log(csstree.generate(firstColorDeclaration));
// color:red
```

## findLast(ast, fn)

Returns the first node in reverse order for which `fn` function returns a truthy value.

```js
import * as csstree from 'css-tree';

const ast = csstree.parse('.a { color: red; } .b { color: green; }');

const firstColorDeclaration = csstree.findLast(ast, (node, item, list) =>
    node.type === 'Declaration' && node.property === 'color'
);

console.log(csstree.generate(firstColorDeclaration));
// color:green
```

## findAll(ast, fn)

Returns all nodes in natural order for which `fn` function returns a truthy value.

```js
import * as csstree from 'css-tree';

const ast = csstree.parse('.a { color: red; } .b { color: green; }');

const colorDeclarations = csstree.findAll(ast, (node, item, list) =>
    node.type === 'Declaration' && node.property === 'color'
);

console.log(colorDeclarations.map(decl => csstree.generate(decl)).join(', '));
// color:red, color:green
```
