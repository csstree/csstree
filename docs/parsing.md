# Parsing CSS into AST

## parse(source[, options])

Parses CSS to AST.

> NOTE: Currenly parser omits redundant separators, spaces and comments (except exclamation comments, i.e. `/*! comment */`) on AST build.

Options:

- `context` String – parsing context, useful when some part of CSS is parsing (see below)
- `atrule` String – make sense for `atruleExpression` context to apply some atrule specific parse rules
- `property` String – make sense for `value` context to apply some property specific parse rules
- `positions` Boolean – should AST contains node position or not, store data in `info` property of nodes (`false` by default)
- `filename` String – filename of source that adds to info when `positions` is true, uses for source map generation (`<unknown>` by default)
- `line` Number – initial line number, useful when parse fragment of CSS to compute correct positions
- `column` Number – initial column number, useful when parse fragment of CSS to compute correct positions

Contexts:

- `stylesheet` (default) – regular stylesheet, should be suitable in most cases
- `atrule` – at-rule (e.g. `@media screen, print { ... }`)
- `atruleExpression` – at-rule expression (`screen, print` for example above)
- `rule` – rule (e.g. `.foo, .bar:hover { color: red; border: 1px solid black; }`)
- `selectorList` – selector group (`.foo, .bar:hover` for rule example)
- `selector` – selector (`.foo` or `.bar:hover` for rule example)
- `block` – block with curly braces (`{ color: red; border: 1px solid black; }` for rule example)
- `declarationList` – block content w/o curly braces (`color: red; border: 1px solid black;` for rule example), useful to parse HTML `style` attribute value
- `declaration` – declaration (`color: red` or `border: 1px solid black` for rule example)
- `value` – declaration value (`red` or `1px solid black` for rule example)

```js
// simple parsing with no options
var ast = csstree.parse('.example { color: red }');

// parse with options
var ast = csstree.parse('.foo.bar', {
    context: 'simpleSelector',
    positions: true
});
```
