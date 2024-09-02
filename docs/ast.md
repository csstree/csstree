# AST format

CSSTree's AST consists of nodes (leaves). Each node is an object with a set of properties that depends on node's type. Nodes can refer to other nodes and contain a list of nested nodes.

Interactively explore the AST with [AST Explorer](https://astexplorer.net/#/gist/244e2fb4da940df52bf0f4b94277db44/e79aff44611020b22cfd9708f3a99ce09b7d67a8).

<!-- MarkdownTOC -->

- [Example](#example)
- [Common node's properties](#common-nodes-properties)
    - [type](#type)
    - [loc](#loc)
    - [children](#children)
- [Node types](#node-types)
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
    - [Condition](#condition)
    - [Declaration](#declaration)
    - [DeclarationList](#declarationlist)
    - [Dimension](#dimension)
    - [Feature](#feature)
    - [FeatureFunction](#featurefunction)
    - [FeatureRange](#featurerange)
    - [Function](#function)
    - [GeneralEnclosed](#generalenclosed)
    - [Hash](#hash)
    - [IdSelector](#idselector)
    - [Identifier](#identifier)
    - [Layer](#layer)
    - [LayerList](#layerlist)
    - [MediaQuery](#mediaquery)
    - [MediaQueryList](#mediaquerylist)
    - [NestingSelector](#nestingselector)
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
    - [Scope](#scope)
    - [Selector](#selector)
    - [SelectorList](#selectorlist)
    - [String](#string)
    - [StyleSheet](#stylesheet)
    - [SupportsDeclaration](#supportsdeclaration)
    - [TypeSelector](#typeselector)
    - [UnicodeRange](#unicoderange)
    - [Url](#url)
    - [Value](#value)
    - [WhiteSpace](#whitespace)

<!-- /MarkdownTOC -->

## Example

Assume we have a CSS:

```css
body {
    color: red;
}
```

An AST for this CSS might look like:

```js
{
    type: 'StyleSheet',
    loc: null,
    children: [
        {
            type: 'Rule',
            loc: null,
            prelude: {
                type: 'SelectorList',
                loc: null,
                children: [
                    {
                        type: 'Selector',
                        loc: null,
                        children: [
                            {
                                type: 'TypeSelector',
                                loc: null,
                                name: 'body'
                            }
                        ]
                    }
                ]
            },
            block: {
                type: 'Block',
                loc: null,
                children: [
                    {
                        type: 'Declaration',
                        loc: null,
                        important: false,
                        property: 'color',
                        value: {
                            type: 'Value',
                            loc: null,
                            children: [
                                {
                                    type: 'Identifier',
                                    loc: null,
                                    name: 'red'
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ]
}
```

> NOTE: The example uses arrays for the values of the property `children`. In fact, the values of this property are instances of the [`List`](List.md) class.

An AST structure (i.e. details level, include positions or not) is depend on options passed to parser. See [Parsing CSS into AST](parsing.md) for details.

## Common node's properties

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

### children

Type: `List` or `null`

Only certain types of nodes can contain this property, such as [`StyleSheet`](#stylesheet) or [`Block`](#block). However, this is the only property that can store a list of nested nodes.

Most node types always store an instance of the `List` in this property, even if there is no nested nodes (the list is empty). Only some node types, such as `PseudoClassSelector` and `PseudoElementSelector`, can store a `null` instead of a list. This is due to the fact that in the absence of a list such node types is represent a pseudo-selector, and in the presence of a list, a functional pseudo-selector. See definition of each node type for details.

## Node types

> NOTE: Despite every node has a `loc` property, this property is excluded from definitions to reduce a noise.

<!-- node types -->

### AnPlusB

Used for [the An+B microsyntax](https://drafts.csswg.org/css-syntax/#anb-microsyntax).

```ts
type AnPlusB = {
    type: "AnPlusB";
    a: string | null;
    b: string | null;
}
```

`a` or `b` fields may have no value (equals to `null`) but not both at the same time. Parser normalizes `a` value to store a valid integer, i.e. parser will store `-1` for `-n` and `1` for `n`.

### Atrule

```ts
type Atrule = {
    type: "Atrule";
    name: string;
    prelude: AtrulePrelude | Raw | null;
    block: Block | null;
}
```

### AtrulePrelude

```ts
type AtrulePrelude = {
    type: "AtrulePrelude";
    children: List<any>;
}
```

### AttributeSelector

```ts
type AttributeSelector = {
    type: "AttributeSelector";
    name: Identifier;
    matcher: string | null;
    value: String | Identifier | null;
    flags: string | null;
}
```

### Block

```ts
type Block = {
    type: "Block";
    children: List<Atrule | Rule | Declaration>;
}
```

### Brackets

```ts
type Brackets = {
    type: "Brackets";
    children: List<any>;
}
```

### CDC

```ts
type CDC = {
    type: "CDC";
}
```

### CDO

```ts
type CDO = {
    type: "CDO";
}
```

### ClassSelector

```ts
type ClassSelector = {
    type: "ClassSelector";
    name: string;
}
```

### Combinator

```ts
type Combinator = {
    type: "Combinator";
    name: string;
}
```

### Comment

```ts
type Comment = {
    type: "Comment";
    value: string;
}
```

### Condition

```ts
type Condition = {
    type: "Condition";
    kind: string;
    children: List<Identifier | Feature | FeatureFunction | FeatureRange | SupportsDeclaration>;
}
```

### Declaration

```ts
type Declaration = {
    type: "Declaration";
    important: boolean | string;
    property: string;
    value: Value | Raw;
}
```

### DeclarationList

```ts
type DeclarationList = {
    type: "DeclarationList";
    children: List<Declaration | Atrule | Rule>;
}
```

### Dimension

```ts
type Dimension = {
    type: "Dimension";
    value: string;
    unit: string;
}
```

### Feature

```ts
type Feature = {
    type: "Feature";
    kind: string;
    name: string;
    value: Identifier | Number | Dimension | Ratio | Function | null;
}
```

### FeatureFunction

```ts
type FeatureFunction = {
    type: "FeatureFunction";
    kind: string;
    feature: string;
    value: Declaration | Selector;
}
```

### FeatureRange

```ts
type FeatureRange = {
    type: "FeatureRange";
    kind: string;
    left: Identifier | Number | Dimension | Ratio | Function;
    leftComparison: string;
    middle: Identifier | Number | Dimension | Ratio | Function;
    rightComparison: string | null;
    right: Identifier | Number | Dimension | Ratio | Function | null;
}
```

### Function

```ts
type Function = {
    type: "Function";
    name: string;
    children: List<any>;
}
```

### GeneralEnclosed

```ts
type GeneralEnclosed = {
    type: "GeneralEnclosed";
    kind: string;
    function: string | null;
    children: List<any>;
}
```

### Hash

```ts
type Hash = {
    type: "Hash";
    value: string;
}
```

### IdSelector

```ts
type IdSelector = {
    type: "IdSelector";
    name: string;
}
```

### Identifier

```ts
type Identifier = {
    type: "Identifier";
    name: string;
}
```

### Layer

```ts
type Layer = {
    type: "Layer";
    name: string;
}
```

### LayerList

```ts
type LayerList = {
    type: "LayerList";
    children: List<Layer>;
}
```

### MediaQuery

```ts
type MediaQuery = {
    type: "MediaQuery";
    modifier: string | null;
    mediaType: string | null;
    condition: Condition | null;
}
```

### MediaQueryList

```ts
type MediaQueryList = {
    type: "MediaQueryList";
    children: List<MediaQuery>;
}
```

### NestingSelector

```ts
type NestingSelector = {
    type: "NestingSelector";
}
```

### Nth

```ts
type Nth = {
    type: "Nth";
    nth: AnPlusB | Identifier;
    selector: SelectorList | null;
}
```

### Number

```ts
type Number = {
    type: "Number";
    value: string;
}
```

### Operator

```ts
type Operator = {
    type: "Operator";
    value: string;
}
```

### Parentheses

```ts
type Parentheses = {
    type: "Parentheses";
    children: List<any>;
}
```

### Percentage

```ts
type Percentage = {
    type: "Percentage";
    value: string;
}
```

### PseudoClassSelector

```ts
type PseudoClassSelector = {
    type: "PseudoClassSelector";
    name: string;
    children: List<Raw> | null;
}
```

### PseudoElementSelector

```ts
type PseudoElementSelector = {
    type: "PseudoElementSelector";
    name: string;
    children: List<Raw> | null;
}
```

### Ratio

```ts
type Ratio = {
    type: "Ratio";
    left: Number | Function;
    right: Number | Function | null;
}
```

### Raw

A sequence of any characters. This node type is used for unparsed fragments of CSS, e.g. due to parse error or parser settings, and for quirk parts like content of some functions, such as `url()` or `expression()`.

```ts
type Raw = {
    type: "Raw";
    value: string;
}
```

### Rule

```ts
type Rule = {
    type: "Rule";
    prelude: SelectorList | Raw;
    block: Block;
}
```

### Scope

```ts
type Scope = {
    type: "Scope";
    root: SelectorList | Raw | null;
    limit: SelectorList | Raw | null;
}
```

### Selector

```ts
type Selector = {
    type: "Selector";
    children: List<TypeSelector | IdSelector | ClassSelector | AttributeSelector | PseudoClassSelector | PseudoElementSelector | Combinator>;
}
```

### SelectorList

```ts
type SelectorList = {
    type: "SelectorList";
    children: List<Selector | Raw>;
}
```

### String

A sequence of characters enclosed in double quotes or single quotes.

```ts
type String = {
    type: "String";
    value: string;
}
```

### StyleSheet

```ts
type StyleSheet = {
    type: "StyleSheet";
    children: List<Comment | CDO | CDC | Atrule | Rule | Raw>;
}
```

### SupportsDeclaration

```ts
type SupportsDeclaration = {
    type: "SupportsDeclaration";
    declaration: Declaration;
}
```

### TypeSelector

```ts
type TypeSelector = {
    type: "TypeSelector";
    name: string;
}
```

### UnicodeRange

Used for [the Unicode-Range microsyntax](https://drafts.csswg.org/css-syntax/#urange).

```ts
type UnicodeRange = {
    type: "UnicodeRange";
    value: string;
}
```

### Url

```ts
type Url = {
    type: "Url";
    value: string;
}
```

### Value

```ts
type Value = {
    type: "Value";
    children: List<any>;
}
```

### WhiteSpace

A sequence of one or more white spaces, i.e. ` ` (space), `\t`, `\r`, `\n` and `\f`.

```ts
type WhiteSpace = {
    type: "WhiteSpace";
    value: string;
}
```

<!-- /node types -->
