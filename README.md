<img align="right" width="111" height="111"
     alt="CSSTree logo"
     src="https://cloud.githubusercontent.com/assets/270491/19243723/6f9136c6-8f21-11e6-82ac-eeeee4c6c452.png"/>

# CSSTree

[![NPM version](https://img.shields.io/npm/v/css-tree.svg)](https://www.npmjs.com/package/css-tree)
[![Build Status](https://travis-ci.org/csstree/csstree.svg?branch=master)](https://travis-ci.org/csstree/csstree)
[![Coverage Status](https://coveralls.io/repos/github/csstree/csstree/badge.svg?branch=master)](https://coveralls.io/github/csstree/csstree?branch=master)
[![Join the CSSTree chat at https://gitter.im/csstree/csstree](https://badges.gitter.im/csstree/csstree.svg)](https://gitter.im/csstree/csstree)
[![Twitter](https://img.shields.io/badge/Twitter-@csstree-blue.svg)](https://twitter.com/csstree)

Fast detailed CSS parser

> Work in progress

Docs and tools:

* [CSS syntax reference](https://csstree.github.io/docs/syntax.html)
* [CSS syntax validator](https://csstree.github.io/docs/validator.html)

Related projects:

* [csstree-validator](https://github.com/csstree/validator) – NPM package to validate CSS
* [stylelint-csstree-validator](https://github.com/csstree/stylelint-validator) – plugin for stylelint to validate CSS
* [Grunt plugin](https://github.com/sergejmueller/grunt-csstree-validator)
* [Gulp plugin](https://github.com/csstree/gulp-csstree)
* [Sublime plugin](https://github.com/csstree/SublimeLinter-contrib-csstree)
* [VS Code plugin](https://github.com/csstree/vscode-plugin)
* [Atom plugin](https://github.com/csstree/atom-plugin)

## Install

```
> npm install css-tree
```

## Usage

```js
var csstree = require('css-tree');

csstree.walk(csstree.parse('.a { color: red; }'), function(node) {
  console.log(node.type);
});
// Class
// SimpleSelector
// Selector
// Property
// Identifier
// Value
// Declaration
// Block
// Ruleset
// StyleSheet
```

## API

### parse(source[, options])

Parse CSS to AST.

> NOTE: Currenly parser omit redundant separators, spaces and comments (except exclamation comments, i.e. `/*! comment */`) on AST build.

Options:

- `context` String – parsing context, useful when some part of CSS is parsing (see below)
- `property` String – make sense for `declaration` context to apply some property specific parse rules
- `positions` Boolean – should AST contains node position or not, store data in `info` property of nodes (`false` by default)
- `filename` String – filename of source that adds to info when `positions` is true, uses for source map generation (`<unknown>` by default)
- `line` Number – initial line number, useful when parse fragment of CSS to compute correct positions
- `column` Number – initial column number, useful when parse fragment of CSS to compute correct positions

Contexts:

- `stylesheet` (default) – regular stylesheet, should be suitable in most cases
- `atrule` – at-rule (e.g. `@media screen, print { ... }`)
- `atruleExpression` – at-rule expression (`screen, print` for example above)
- `ruleset` – rule (e.g. `.foo, .bar:hover { color: red; border: 1px solid black; }`)
- `selector` – selector group (`.foo, .bar:hover` for ruleset example)
- `simpleSelector` – selector (`.foo` or `.bar:hover` for ruleset example)
- `block` – block content w/o curly braces (`color: red; border: 1px solid black;` for ruleset example)
- `declaration` – declaration (`color: red` or `border: 1px solid black` for ruleset example)
- `value` – declaration value (`red` or `1px solid black` for ruleset example)

```js
// simple parsing with no options
var ast = csstree.parse('.example { color: red }');

// parse with options
var ast = csstree.parse('.foo.bar', {
    context: 'simpleSelector',
    positions: true
});
```

### clone(ast)

Make an AST node deep copy.

```js
var orig = csstree.parse('.test { color: red }');
var copy = csstree.clone(orig);

csstree.walk(copy, function(node) {
    if (node.type === 'Class') {
        node.name = 'replaced';
    }
});

console.log(csstree.translate(orig));
// .test{color:red}
console.log(csstree.translate(copy));
// .replaced{color:red}
```

### translate(ast)

Converts AST to string.

```js
var ast = csstree.parse('.test { color: red }');
console.log(csstree.translate(ast));
// > .test{color:red}
```

### translateWithSourceMap(ast)

The same as `translate()` but also generates source map (nodes should contain positions in `info` property).

```js
var ast = csstree.parse('.test { color: red }', {
    filename: 'my.css',
    positions: true
});
console.log(csstree.translateWithSourceMap(ast));
// { css: '.test{color:red}', map: SourceMapGenerator {} }
```

### walk(ast, handler)

Visit all nodes of AST and call handler for each one. `handler` receives three arguments:

- `node` – current AST node
- `item` – node wrapper when node is a list member; this wrapper contains references to `prev` and `next` nodes in list
- `list` – reference to list when node is a list member; it's useful for operations on list like `remove()` or `insert()`

Context for handler an object, that contains references to some parent nodes:

- `root` – refers to `ast` or root node
- `stylesheet` – refers to closest `StyleSheet` node, it may be a top-level or at-rule block stylesheet
- `atruleExpression` – refers to `AtruleExpression` node if current node inside at-rule expression
- `ruleset` – refers to `Ruleset` node if current node inside a ruleset
- `selector` – refers to `Selector` node if current node inside a selector
- `declaration` – refers to `Declaration` node if current node inside a declaration
- `function` – refers to closest `Function` or `FunctionalPseudo` node if current node inside one of them

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

### walkRules(ast, handler)

Same as `walk()` but visits `Ruleset` and `Atrule` nodes only.

### walkRulesRight(ast, handler)

Same as `walkRules()` but visits nodes in reverse order (from last to first).

### walkDeclarations(ast, handler)

Visit all declarations.

## License

MIT

Syntax matching use [mdn/data](https://github.com/mdn/data) dictionaries by Mozilla Contributors
