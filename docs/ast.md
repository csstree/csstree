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

Used to represent [the An+B microsyntax](https://drafts.csswg.org/css-syntax/#anb-microsyntax).

```
{
    "type": "AnPlusB",
    "a": String | null,
    "b": String | null
}
```

`a` and `b` may have no value (to be equals to `null`) but not both at the same time. Parser normalizes `a` value to store a valid interger, i.e. for `-n` it will contains `-1` and for `n` it will contains `1`.

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>2n + 1</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>2n+1</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>2n - 1</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>2n-1</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>3n</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>+3n</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>-3n</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>1n</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>+1n</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>-1n</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>n</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>+n</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>-n</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>1</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>+1</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>-1</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Atrule

```
{
    "type": "Atrule",
    "name": String,
    "expression": <AtruleExpression> | null,
    "block": <Block> | null
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>@charset "utf8";</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>@import "foo.css";</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>@supports (a: 1) {}</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

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
    "operator": String | null,
    "value": <String> | <Identifier> | null,
    "flags": String | null
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>[foo]</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>[foo i]</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>[foo=bar]</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>[foo=bar i]</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>[foo="bar"]</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>[foo="bar" i]</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>[foo~=bar]</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>[foo^=bar]</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>[foo$=bar]</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>[foo*=bar]</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>[foo|=bar]</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Block

```
{
    "type": "Block",
    "children": List
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>{}</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>{ foo: bar }</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>{ @test; }</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Brackets

```
{
    "type": "Brackets",
    "children": List
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>[]</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>[foo bar]</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## CDC

```
{
    "type": "CDC"
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>&lt;!--</td><td>&lt;!--</td><td><pre>{
    "type": "StyleSheet",
    "loc": null,
    "children": [
        {
            "type": "CDO",
            "loc": null
        }
    ]
}</pre></td></tr>
</tbody></table>

## CDO

```
{
    "type": "CDO"
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>--&gt;</td><td>--&gt;</td><td><pre>{
    "type": "StyleSheet",
    "loc": null,
    "children": [
        {
            "type": "CDC",
            "loc": null
        }
    ]
}</pre></td></tr>
</tbody></table>

## ClassSelector

```
{
    "type": "ClassSelector",
    "name": String
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>.name</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Combinator

```
{
    "type": "Combinator",
    "name": String
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>+</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>&gt;</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>~</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>/deep/</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Comment

```
{
    "type": "Comment",
    "value": String
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>/* comment */</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>/*! comment */</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Declaration

```
{
    "type": "Declaration",
    "important": Boolean | String,
    "property": String,
    "value": <Value> | <Raw>
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>property: value</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>--custom-property: value</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## DeclarationList

```
{
    "type": "DeclarationList",
    "children": List
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>foo: 1; bar: 2</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Dimension

```
{
    "type": "Dimension",
    "value": String,
    "unit": String
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>1px</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Function

```
{
    "type": "Function",
    "name": String,
    "children": List
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>fn()</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>fn(1, 2)</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## HexColor

```
{
    "type": "HexColor",
    "value": String
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>#abc</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>#abc123</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## IdSelector

```
{
    "type": "IdSelector",
    "name": String
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>#id</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Identifier

```
{
    "type": "Identifier",
    "name": String
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>ident</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>-prefix-ident</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>--custom</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## MediaFeature

```
{
    "type": "MediaFeature",
    "name": String,
    "value": <Identifier> | <Number> | <Dimension> | <Ratio> | null
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>feature</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>feature: ident</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>feature: 123</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>feature: 123px</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>feature: 1/2</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## MediaQuery

```
{
    "type": "MediaQuery",
    "children": List
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>(feature) and (feature: 2)</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## MediaQueryList

```
{
    "type": "MediaQueryList",
    "children": List
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>all, (feature: test)</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Nth

```
{
    "type": "Nth",
    "nth": <AnPlusB> | <Identifier>,
    "selector": <SelectorList> | null
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>2n + 1</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>odd</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>even</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Number

```
{
    "type": "Number",
    "value": String
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>1</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>-1</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>.2</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>-.2</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>3.4</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>-3.4</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>1e3</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>-1.2e2</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Operator

```
{
    "type": "Operator",
    "value": String
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
    "value": String
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>50%</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## PseudoClassSelector

```
{
    "type": "PseudoClassSelector",
    "name": String,
    "children": List | null
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>:ident</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>:ident(content)</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## PseudoElementSelector

```
{
    "type": "PseudoElementSelector",
    "name": String,
    "children": List | null
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>::ident</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>::ident(content)</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Ratio

```
{
    "type": "Ratio",
    "left": String,
    "right": String
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>1/2</td><td>-</td><td><pre>Parse error</pre></td></tr>
<tr><td>1 / 2</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Raw

```
{
    "type": "Raw",
    "value": String
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>raw is anything</td><td>-</td><td><pre>Parse error</pre></td></tr>
</tbody></table>

## Rule

```
{
    "type": "Rule",
    "selector": <SelectorList> | <Raw>,
    "block": <Block>
}
```

<table><thead><tr><th>CSS</th><th>Stringify (default)</th><th>AST</th></tr></thead><tbody>
<tr><td>selector { property: value }</td><td>selector{property:value}</td><td><details><summary>50 lines</summary><pre>{
    "type": "StyleSheet",
    "loc": null,
    "children": [
        {
            "type": "Rule",
            "loc": null,
            "selector": {
                "type": "SelectorList",
                "loc": null,
                "children": [
                    {
                        "type": "Selector",
                        "loc": null,
                        "children": [
                            {
                                "type": "TypeSelector",
                                "loc": null,
                                "name": "selector"
                            }
                        ]
                    }
                ]
            },
            "block": {
                "type": "Block",
                "loc": null,
                "children": [
                    {
                        "type": "Declaration",
                        "loc": null,
                        "important": false,
                        "property": "property",
                        "value": {
                            "type": "Value",
                            "loc": null,
                            "children": [
                                {
                                    "type": "Identifier",
                                    "loc": null,
                                    "name": "value"
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ]
}</pre></details></td></tr>
</tbody></table>

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
    "value": String
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
    "name": String
}
```

## UnicodeRange

```
{
    "type": "UnicodeRange",
    "value": String
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
    "value": String
}
```
