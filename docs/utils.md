# Util functions

<!-- TOC depthFrom:2 -->

- Value encoding & decoding
    - [property(name)](#propertyname)
    - [keyword(name)](#keywordname)
    - [ident](#ident)
    - [string](#string)
    - [url](#url)
- AST transforming
    - [clone(ast)](#cloneast)
    - [fromPlainObject(object)](#fromplainobjectobject)
    - [toPlainObject(ast)](#toplainobjectast)

<!-- /TOC -->

## Value encoding & decoding
### property(name)

Returns details for a property name, such as vendor prefix, used hack etc. Using for safe test of declaration property names, i.e. `Declaration.property`.

```js
import * as csstree from 'css-tree';

csstree.property('*-vendor-property');
// {
//     basename: 'property',
//     name: '-vendor-property',
//     hack: '*',
//     vendor: '-vendor-',
//     prefix: '*-vendor-',
//     custom: false
// }

csstree.property('--test-var');
// {
//     basename: '--test-var',
//     name: '--test-var',
//     hack: '',
//     vendor: '',
//     prefix: '',
//     custom: true
// };
```

`property()` function normalizes a name to lower case, except custom property names since they are case-sensitive. It returns the same immutable (frozen) object for the same input (input after normalization).

```js
csstree.property('name') === csstree.property('NAME')         // true
csstree.property('NAME').name === 'name'                      // true
csstree.property('--custom') === csstree.property('--Custom') // false

const info = csstree.property('NAME');
info.name === 'name'; // true
info.name = 'foo';    // have no effect
info.name === 'name'; // true
```

Supported hacks:

- `_` in the beginning
- `+` in the beginning
- `#` in the beginning
- `*` in the beginning
- `$` in the beginning
- `/` in the beginning
- `//` in the beginning

### keyword(name)

Mostly the same as `property()` function, but without hack detection. Using for any identifier except declaration property name.

```js
import * as csstree from 'css-tree';

csstree.keyword('-vendor-keyword');
// {
//     basename: 'keyword',
//     name: '-vendor-keyword',
//     vendor: '-vendor-',
//     prefix: '-vendor-',
//     custom: false
// };
```

### ident

Decode and encode of `ident` token values.

```js
import { ident } from 'css-tree';

ident.decode('hello\\9 \\ world')   // hello\t world
ident.encode('hello\t world')       // hello\9 \ world
```

### string

Decode and encode of `string` token values.

```js
import { string } from 'css-tree';

string.decode('"hello\\9  \\"world\\""') // hello\t "world"
string.decode('\'hello\\9  "world"\'')   // hello\t "world"
string.encode('hello\t "world"')         // "hello\9  \"world\""
string.encode('hello\t "world"', true)   // 'hello\9  "world"'
```

### url

Decode and encode of `url` token values.

```js
import { url } from 'css-tree';

url.decode('url(file\ \(1\).ext)')  // file (1).ext
url.encode('file (1).ext')          // url(file\ \(1\).ext)
```

## AST transforming

### clone(ast)

Make AST deep copy.

```js
const orig = csstree.parse('.test { color: red }');
const copy = csstree.clone(orig);

csstree.walk(copy, function(node) {
    if (node.type === 'ClassSelector') {
        node.name = 'replaced';
    }
});

console.log(csstree.generate(orig));
// .test{color:red}
console.log(csstree.generate(copy));
// .replaced{color:red}
```

## fromPlainObject(object)

`fromPlainObject()` walks through AST and coverts each `children` value into a `List` instance when value is an array.

```js
import * as csstree from 'css-tree';

const ast = {
    type: 'SelectorList',
    children: []
};

Array.isArray(ast.children)          // true
ast.children instanceof csstree.List // false

ast = csstree.fromPlainObject(ast);

Array.isArray(ast.children)          // false
ast.children instanceof csstree.List // true
```

Function mutates the passed AST. Use `clone()` function before passing AST to `fromPlainObject()` in case you want to avoid original tree mutation.

```js
astClone = csstree.fromPlainObject(csstree.clone(ast));
```

## toPlainObject(ast)

`fromPlainObject()` walks through AST and coverts each `children` value to regular array when value is a `List` instance.

```js
import * as csstree from 'css-tree';

const ast = {
    type: 'SelectorList',
    children: new List()
};

Array.isArray(ast.children)          // false
ast.children instanceof csstree.List // true

ast = csstree.toPlainObject(ast);

Array.isArray(ast.children)          // true
ast.children instanceof csstree.List // false
```

Function mutates the passed AST. Use `clone()` function before passing AST to `toPlainObject()` in case you want to avoid original tree mutation.

```js
ast = csstree.toPlainObject(csstree.clone(ast));
```
