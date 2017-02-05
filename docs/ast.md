# AST format

CSSTree represents AST as object tree. Each node is object with `type` property that indicates its type. Other properties set depends on node type

Each node contains a `loc` property, but not included in descriptions to aboid noise. Its value contains object with positions or null depending on parsing settings.

> Details on each node to be done

Pending changes:

- `Progid` is subject to be removed
- `Space` will be extended to store actual whitespaces
- `Type`, `Universal`, `Id`, `Class`, `Attribute`, `PseudoClass` and `PseudoElement` may to be renamed with `Selector` suffix
- `PseudoClass` and `PseudoElement` may to be joined into single type `Pseudo` (or `PseudoSelector`)

Other node types are stable enough.

Node types:

<!-- MarkdownTOC -->

- [AnPlusB](#anplusb)
- [Atrule](#atrule)
- [AtruleExpression](#atruleexpression)
- [Attribute](#attribute)
- [Block](#block)
- [Brackets](#brackets)
- [Class](#class)
- [Combinator](#combinator)
- [Comment](#comment)
- [Declaration](#declaration)
- [DeclarationList](#declarationlist)
- [Dimension](#dimension)
- [Function](#function)
- [Hash](#hash)
- [Id](#id)
- [Identifier](#identifier)
- [MediaFeature](#mediafeature)
- [MediaQuery](#mediaquery)
- [MediaQueryList](#mediaquerylist)
- [Nth](#nth)
- [Number](#number)
- [Operator](#operator)
- [Parentheses](#parentheses)
- [Percentage](#percentage)
- [Progid](#progid)
- [PseudoClass](#pseudoclass)
- [PseudoElement](#pseudoelement)
- [Ratio](#ratio)
- [Raw](#raw)
- [Rule](#rule)
- [Selector](#selector)
- [SelectorList](#selectorlist)
- [Space](#space)
- [String](#string)
- [StyleSheet](#stylesheet)
- [Type](#type)
- [UnicodeRange](#unicoderange)
- [Universal](#universal)
- [Url](#url)
- [Value](#value)

<!-- /MarkdownTOC -->


## AnPlusB

```
{
    "type": "AnPlusB",
    "a": string | null,
    "b": string | null
}
```

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

## Attribute

```
{
    "type": "Attribute",
    "name": string,
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

## Class

```
{
    "type": "Class",
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

## Hash

```
{
    "type": "Hash",
    "value": string
}
```

## Id

```
{
    "type": "Id",
    "name": string
}
```

## Identifier

```
{
    "type": "Identifier",
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

## Progid

```
{
    "type": "Progid",
    "value": string
}
```

## PseudoClass

```
{
    "type": "PseudoClass",
    "name": string,
    "children": List | null
}
```

## PseudoElement

```
{
    "type": "PseudoElement",
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

## Space

```
{
    "type": "Space"
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

## Type

```
{
    "type": "Type",
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

## Universal

```
{
    "type": "Universal",
    "name": string
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
