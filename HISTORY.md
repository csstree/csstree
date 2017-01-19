## 1.0.0-alpha13 (January 19, 2017)

- Changed location storing in `SyntaxMatchError`
    - Changed property to store mismatch offset to `mismatchOffset`
    - Changed `offset` property to store bad node offset in source CSS if any
    - Added `loc` property that stores bad node `loc` if any

## 1.0.0-alpha12 (January 19, 2017)

- Fixed `Syntax#matchProperty()` method to always return a positive result for custom properties since syntax is never defined for them (#31)
- Implemented `fromPlainObject()` and `toPlainObject()` to convert plain object to AST or AST to plain object (currently converts `List` <-> `Array`)

## 1.0.0-alpha11 (January 18, 2017)

- Added support for `:matches(<selector-list>)` (#28)
- Added support for `:has(<relative-selector-list>)`
- Added support for `::slotted(<compound-selector>)`
- Implemented `Brackets` node type
- Implemented basic support for at-rule inside rule block (#24)
- Renamed `Selector` node type to `SelectorList`
- Renamed `SimpleSelector` node type to `Selector`
- Renamed `UnicodeRange.name` property to `UnicodeRange.value`
- Replaced `Negation` node type for regular `PseudoClass`
- Unified name of node property to store nested nodes, it always `children` now:
    - `StyleSheet.rules` -> `StyleSheet.children`
    - `SelectorList.selectors` -> `SelectorList.children`
    - `Block.declarations` -> `Block.children`
    - `*.sequence` -> `*.children`
- Fixed edge cases in parsing `Hex` and `UnicodeRange` when number not an integer
- Changed `nth-` pseudos parsing
    - Implemented `An+B` node type to represent expressions like `2n + 1` or `-3n`
    - Fixed edge cases when `a` or `b` is not an integer
    - Changed `odd` and `even` keywords processing, keywords are storing as `Identifier` node type now
    - Changed `Nth` node type format to store a `nth`-query and an optional `selector`
    - Implemented `of` clause for `nth-` pseudos (a.e. `:nth-child(2n + 1 of li, img)`)
    - Limited `Nth` parsing rules to `:nth-child()`, `:nth-last-child()`, `:nth-of-type()` and `:nth-last-of-type()` pseudos
- Changed the way to store locations
    - Renamed `info` node property to `loc`
    - Changed format of `loc` to store `start` and `end` positions

## 1.0.0-alpha10 (January 11, 2017)

- Reworked `Scanner` to be a single point to its functionality
- Exposed `Scanner` class to be useful for external projects
- Changed `walk()` function behaviour to traverse AST nodes in natural order
- Implemented `walkUp()` function to traverse AST nodes from deepest to parent (behaves as `walk()` before)

## 1.0.0-alpha9 (December 21, 2016)

- Fixed `<angle>` generic according to specs that allow a `<number>` equals to zero to be used as valid value (#30)

## 1.0.0-alpha8 (November 11, 2016)

- Fixed `Scanner#skip()` issue method when cursor is moving to the end of source
- Simplified `Progid` node
- Changed behaviour for bad selector processing, now parsing fails instead of selector ignoring
- Fixed `<id-selector>` generic syntax
- Added `q` unit for `<length>` generic syntax
- Refactored syntax parser (performance)
- Reduced startup time by implementing lazy syntax parsing (default syntax doesn't parse on module load)
- Updated syntax dictionaries and used [`mdn/data`](https://github.com/mdn/data) instead of `Template:CSSData`
- Renamed `syntax.stringify()` method to `syntax.translate()`
- Simplified generic syntax functions, those functions receive a single AST node for checking and should return `true` or `false`
- Added exception for values that contains `var()`, those values are always valid for now
- Added more tests and increase code coverage to `98.5%`

## 1.0.0-alpha7 (October 7, 2016)

- Added support for explicit descendant combinator (`>>`)
- Implemented `Type` and `Universal` type nodes
- Improved `Number` parsing by including sign and exponent (#26)
- Parse `before`, `after`, `first-letter` and `first-line` pseudos with single colon as `PseudoElement`
- Changed `FunctionalPseudo` node type to `PseudoClass`
- Fixed attribute selector name parsing (namespace edge cases)
- Fixed location calculation for specified offset when `eof` is reached
- Added more non-standard colors (#25)
- Removed obsolete `Syntax#getAll()` method
- Fixed various edge cases, code clean up and performance improvements

## 1.0.0-alpha6 (September 23, 2016)

- More accurate positions for syntax mismatch errors
- Added [`apple`](https://webkit.org/blog/3709/using-the-system-font-in-web-content/) specific font keywords (#20)
- Changed `Property` node stucture from object to string
- Renamed `Ruleset` node type to `Rule`
- Removed `Argument` node type
- Fixed `Dimension` and `Percentage` position computation
- Fixed bad selector parsing (temporary solution)
- Fixed location computation for CSS with very long lines that may lead to really long parsing with `positions:true` (even freeze)
- Fixed `line` and `column` computation for `SyntaxMatch` error
- Improved performance of parsing and translation. Now CSSTree is under 10ms in [PostCSS benchmark](https://github.com/postcss/benchmark).
