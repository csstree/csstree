# AST format

CSSTree's AST is an object tree. Each node is object with `type` property that indicates its type. Other property set depends on node type.

Each node have a `loc` property, but not included in descriptions to avoid noise. Its value contains an object with node content positions in source string or null depending on parsing settings.

> Details on each node to be done

Other node types are stable enough.

Node types:

<!-- MarkdownTOC -->

- [AnPlusB](#anplusb)
- [Atrule](#atrule)
- [AtruleExpression](#atruleexpression)
- [AttributeSelector](#attributeselector)
- [Block](#block)
- [Brackets](#brackets)
- [ClassSelector](#classselector)
- [Combinator](#combinator)
- [Comment](#comment)
- [Declaration](#declaration)
- [DeclarationList](#declarationlist)
- [Dimension](#dimension)
- [Function](#function)
- [HexColor](#hexcolor)
- [Identifier](#identifier)
- [IdSelector](#idselector)
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

Used to represent [the An+B microsyntax](https://drafts.csswg.org/css-syntax/#anb-microsyntax).

```
{
    "type": "AnPlusB",
    "a": string | null,
    "b": string | null
}
```

`a` and `b` may have no value (to be equals to `null`) but not both at the same time. Parser normalizes `a` value to store a valid interger, i.e. for `-n` it will contains `-1` and for `n` it will contains `1`.

## Atrule

```
{
    "type": "Atrule",
    "expression": <AtruleExpression> | <MediaQuery> | <SelectorList> | <Raw> | null,
    "block": <Block> | null
}
```

## AtruleExpression

```
{
    "type": "AtruleExpression",
    "children": List
}
```

## AttributeSelector

```
{
    "type": "AttributeSelector",
    "name": <Identifier>,
    "operator": string | null,
    "value": <String> | <Identifier> | null,
    "flags": string | null
}
```

## Block

```
{
    "type": "Block",
    "children": List
}
```

## Brackets

```
{
    "type": "Brackets",
    "children": List
}
```

## ClassSelector

```
{
    "type": "ClassSelector",
    "name": string
}
```

## Combinator

```
{
    "type": "Combinator",
    "name": string
}
```

## Comment

```
{
    "type": "Comment",
    "value": string
}
```

## Declaration

```
{
    "type": "Declaration",
    "important": boolean,
    "property": string,
    "value": <Value> | <Raw>
}
```

## DeclarationList

```
{
    "type": "DeclarationList",
    "children": List
}
```

## Dimension

```
{
    "type": "Dimension",
    "value": string,
    "unit": string
}
```

## Function

```
{
    "type": "Function",
    "name": string,
    "children": List
}
```

## HexColor

```
{
    "type": "HexColor",
    "value": string
}
```

## Identifier

```
{
    "type": "Identifier",
    "name": string
}
```

## IdSelector

```
{
    "type": "IdSelector",
    "name": string
}
```

## MediaFeature

```
{
    "type": "MediaFeature",
    "name": string,
    "value": string | null
}
```

## MediaQuery

```
{
    "type": "MediaQuery",
    "children": List
}
```

## MediaQueryList

```
{
    "type": "MediaQueryList",
    "children": List
}
```

## Nth

```
{
    "type": "Nth",
    "nth": <Nth> | <Identifier>
    "selector": <SelectorList> | null
}
```

## Number

```
{
    "type": "Number",
    "value": string
}
```

## Operator

```
{
    "type": "Operator",
    "value": string
}
```

## Parentheses

```
{
    "type": "Parentheses",
    "children": List
}
```

## Percentage

```
{
    "type": "Percentage",
    "value": string
}
```

## PseudoClassSelector

```
{
    "type": "PseudoClassSelector",
    "name": string,
    "children": List | null
}
```

## PseudoElementSelector

```
{
    "type": "PseudoElementSelector",
    "name": string,
    "children": List | null
}
```

## Ratio

```
{
    "type": "Ratio",
    "left": string,
    "right": string
}
```

## Raw

```
{
    "type": "Raw",
    "value": string
}
```

## Rule

```
{
    "type": "Rule",
    "selector": <SelectorList>,
    "block": <Block>
}
```

## Selector

```
{
    "type": "Selector",
    "children": List
}
```

## SelectorList

```
{
    "type": "SelectorList",
    "children": List
}
```

## String

```
{
    "type": "String",
    "value": string
}
```

## StyleSheet

```
{
    "type": "StyleSheet",
    "children": List
}
```

## TypeSelector

```
{
    "type": "TypeSelector",
    "name": string
}
```

## UnicodeRange

```
{
    "type": "UnicodeRange",
    "value": string
}
```

## Url

```
{
    "type": "Url",
    "value": <String> | <Raw>
}
```

## Value

```
{
    "type": "Value",
    "children": List
}
```

## WhiteSpace

```
{
    "type": "WhiteSpace",
    "value": string
}
```
