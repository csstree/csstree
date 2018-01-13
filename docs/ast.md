# AST format

Interactively explore the AST with [AST Explorer](https://astexplorer.net/#/gist/244e2fb4da940df52bf0f4b94277db44/e79aff44611020b22cfd9708f3a99ce09b7d67a8).

## Common properties

All nodes have the following properties.

### type

Type: `String`

Indicates the type of a node. The possible values are the ones listed in the [Node types](#node-types) below.

### loc

Type: `Object` or `null`

Information about the position in the source string that corresponds to the node. It has the following structure:

```js
{
    source: String,
    start: {
        offset: Number,
        line: Number,
        column: Number
    },
    end: {
        offset: Number,
        line: Number,
        column: Number
    }
}
```

The `source` property contains value of `options.filename` if passed to `csstree.parse()`, otherwise `"<unknown>"`.

The `offset` number is zero-based, indicates the index in a source string passed to the parser.

The `line` and `column` numbers are 1-based: the first line is `1` and the first column of a line is `1`.

The `loc` property lets you know from which source file the node comes from (if available) and what part of that file was parsed into the node. By default parser doesn't include `loc` data into the AST (sets `null` for this property), you should pass `options.positions` equal to `true` to make `loc` filled.

## Node types

> NOTE: Despite every node has a `loc` property, this property is excluded from definitions to reduce a noise.

<!-- MarkdownTOC -->

- [AnPlusB](#anplusb)
- [Atrule](#atrule)
- [AtrulePrelude](#atruleprelude)
- [AttributeSelector](#attributeselector)
- [Block](#block)
- [Brackets](#brackets)
- [CDC](#cdc)
- [CDO](#cdo)
- [ClassSelector](#classselector)
- [Combinator](#combinator)
- [Comment](#comment)
- [Declaration](#declaration)
- [DeclarationList](#declarationlist)
- [Dimension](#dimension)
- [Function](#function)
- [HexColor](#hexcolor)
- [IdSelector](#idselector)
- [Identifier](#identifier)
- [MediaFeature](#mediafeature)
- [MediaQuery](#mediaquery)
- [MediaQueryList](#mediaquerylist)
- [Nth](#nth)
- [Number](#number)
- [Operator](#operator)
- [Parentheses](#parentheses)
- [Percentage](#percentage)
- [PseudoClassSelector](#pseudoclassselector)
- [PseudoElementSelector](#pseudoelementselector)
- [Ratio](#ratio)
- [Raw](#raw)
- [Rule](#rule)
- [Selector](#selector)
- [SelectorList](#selectorlist)
- [String](#string)
- [StyleSheet](#stylesheet)
- [TypeSelector](#typeselector)
- [UnicodeRange](#unicoderange)
- [Url](#url)
- [Value](#value)
- [WhiteSpace](#whitespace)

<!-- /MarkdownTOC -->

## AnPlusB

Used for [the An+B microsyntax](https://drafts.csswg.org/css-syntax/#anb-microsyntax).

```js
{
    type: "AnPlusB",
    a: String | null,
    b: String | null
}
```

`a` or `b` fields may have no value (equals to `null`) but not both at the same time. Parser normalizes `a` value to store a valid integer, i.e. parser will store `-1` for `-n` and `1` for `n`.

## Atrule

```js
{
    type: "Atrule",
    name: String,
    prelude: <AtrulePrelude> | <Raw> | null,
    block: <Block> | null
}
```

## AtrulePrelude

```js
{
    type: "AtrulePrelude",
    children: List
}
```

## AttributeSelector

```js
{
    type: "AttributeSelector",
    name: <Identifier>,
    matcher: String | null,
    value: <String> | <Identifier> | null,
    flags: String | null
}
```

## Block

```js
{
    type: "Block",
    children: List
}
```

## Brackets

```js
{
    type: "Brackets",
    children: List
}
```

## CDC

```js
{
    type: "CDC"
}
```

## CDO

```js
{
    type: "CDO"
}
```

## ClassSelector

```js
{
    type: "ClassSelector",
    name: String
}
```

## Combinator

```js
{
    type: "Combinator",
    name: String
}
```

## Comment

```js
{
    type: "Comment",
    value: String
}
```

## Declaration

```js
{
    type: "Declaration",
    important: Boolean | String,
    property: String,
    value: <Value> | <Raw>
}
```

## DeclarationList

```js
{
    type: "DeclarationList",
    children: List
}
```

## Dimension

```js
{
    type: "Dimension",
    value: String,
    unit: String
}
```

## Function

```js
{
    type: "Function",
    name: String,
    children: List
}
```

## HexColor

```js
{
    type: "HexColor",
    value: String
}
```

## IdSelector

```js
{
    type: "IdSelector",
    name: String
}
```

## Identifier

```js
{
    type: "Identifier",
    name: String
}
```

## MediaFeature

```js
{
    type: "MediaFeature",
    name: String,
    value: <Identifier> | <Number> | <Dimension> | <Ratio> | null
}
```

## MediaQuery

```js
{
    type: "MediaQuery",
    children: List
}
```

## MediaQueryList

```js
{
    type: "MediaQueryList",
    children: List
}
```

## Nth

```js
{
    type: "Nth",
    nth: <AnPlusB> | <Identifier>,
    selector: <SelectorList> | null
}
```

## Number

```js
{
    type: "Number",
    value: String
}
```

## Operator

```js
{
    type: "Operator",
    value: String
}
```

## Parentheses

```js
{
    type: "Parentheses",
    children: List
}
```

## Percentage

```js
{
    type: "Percentage",
    value: String
}
```

## PseudoClassSelector

```js
{
    type: "PseudoClassSelector",
    name: String,
    children: List | null
}
```

## PseudoElementSelector

```js
{
    type: "PseudoElementSelector",
    name: String,
    children: List | null
}
```

## Ratio

```js
{
    type: "Ratio",
    left: String,
    right: String
}
```

## Raw

```js
{
    type: "Raw",
    value: String
}
```

## Rule

```js
{
    type: "Rule",
    prelude: <SelectorList> | <Raw>,
    block: <Block>
}
```

## Selector

```js
{
    type: "Selector",
    children: List
}
```

## SelectorList

```js
{
    type: "SelectorList",
    children: List
}
```

## String

```js
{
    type: "String",
    value: String
}
```

## StyleSheet

```js
{
    type: "StyleSheet",
    children: List
}
```

## TypeSelector

```js
{
    type: "TypeSelector",
    name: String
}
```

## UnicodeRange

```js
{
    type: "UnicodeRange",
    value: String
}
```

## Url

```js
{
    type: "Url",
    value: <String> | <Raw>
}
```

## Value

```js
{
    type: "Value",
    children: List
}
```

## WhiteSpace

```js
{
    type: "WhiteSpace",
    value: String
}
```
