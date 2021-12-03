# Serialization AST to CSS

## generate(ast[, options])

Generates a CSS string for given AST.

```js
// generate with default settings
csstree.generate(ast);

// generate with options
csstree.generate(ast, {
    sourceMap: true
});
```

Options (optional):

<!-- MarkdownTOC -->

- [sourceMap](#sourcemap)
- [decorator](#decorator)

<!-- /MarkdownTOC -->

### sourceMap

Type: `boolean`  
Default: `false`

Generates a source map (nodes should contain positions in `loc` property). Note, that an object instead of string is returned in that case.

```js
import { parse, generate } from 'css-tree';

const ast = parse('.test { color: red }', {
    filename: 'my.css',
    positions: true
});

const result = generate(ast, { sourceMap: true });
// { css: '.test{color:red}', map: SourceMapGenerator {} }
```

### decorator

Type: `function`  
Default: none

A function that returns handlers used by a generator. TBD

### mode

Type: `"spec"` or `"safe"`  
Default: `"spec"`

CSS Syntax Module defines [rules for CSS serialization](https://www.w3.org/TR/css-syntax-3/#serialization) that it must "round-trip" with parsing. The generator follows these rules and determines itself when to output the space to avoid unintended CSS tokens combining. However, some older browsers fail to parse the resulting CSS because they didn't follow the spec in some cases. For this reason, the generator supports two modes:

- `safe` (by default) which adds an extra space in some edge cases;
- `spec` which completely follows the spec.

```js
import { parse, generate } from 'css-tree';

const ast = parse('a { border: calc(1px) solid #ff0000 }');

// safe mode is by default
// the same as console.log(generate(ast, { mode: 'safe' }));
console.log(generate(ast));
// a{border:calc(1px) solid#ff0000}

// spec mode
console.log(generate(ast, { mode: 'spec' }));
// a{border:calc(1px)solid#ff0000}
```