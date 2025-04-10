# Fork API

CSSTree offers a flexible API for customizing and extending the functionality of the library, known as the "Fork API".

> [!WARNING]
> **This feature is more advanced and assumes familiarity with the library's internals.** Regular users typically won't
> need to fork the library, so you can skip this section if it doesn't apply to your use case.

## Getting started

Here is an example of how to fork the library and add a new pseudo-class:

```js
import * as cssTree from 'css-tree';
import { inspect } from 'util';

const CUSTOM_PSEUDO_NAME = 'custom-pseudo';
const TEST_INPUT = `:${CUSTOM_PSEUDO_NAME}(#id)`;

// Create a new CSSTree fork
const customCssTree = cssTree.fork({
    // Customize the fork's behavior, e.g., adding a new pseudo-class
    pseudo: {
        // Add a new pseudo-class
        [CUSTOM_PSEUDO_NAME]: {
            parse() {
                // Via the `this`, you can access the full internal state of the parser
                return this.createSingleNodeList(this.Selector());
            },
        },
    },
});

// Parse the input with the forked and the default CSSTree as well
[cssTree, customCssTree].forEach((cssTreeInstance) => {
    console.log(
        inspect(
            cssTree.toPlainObject(
                cssTreeInstance.parse(TEST_INPUT, { context: 'selector' }),
            ),
            { depth: null, colors: true },
        ),
    );
});
```

The key difference between the original and forked ASTs is that the original library treats the new pseudo-class as a
simple `Raw` node, whereas the forked library recognizes it as a `Selector` node:

```diff
{
  type: 'Selector',
  loc: null,
  children: [
    {
      type: 'PseudoClassSelector',
      loc: null,
      name: 'custom-pseudo',
-     children: [ { type: 'Raw', loc: null, value: '#id' } ]
+     children: [
+       {
+         type: 'Selector',
+         loc: null,
+         children: [ { type: 'IdSelector', loc: null, name: 'id' } ]
+       }
+     ]
    }
  ]
}
```

The Fork API provides the same API as the original library, including the `fork()` function, even allowing you to fork
the fork if necessary.

## Fork options

You can customize the fork's behavior by passing an options object to the `fork()` function. Here are the available
properties:

### `generic`

A boolean flag that enables or disables generic types in the lexer.

```js
import * as cssTree from 'css-tree';
import assert from 'assert';

const customCssTree = cssTree.fork({
    // Disable generic types
    generic: false,
});

const node = cssTree.parse('1px', { context: 'value' });

// Forked CSSTree should throw for a generic type, because it is disabled
// (<length> is a generic type)
assert.throws(() => customCssTree.lexer.match('<length>', node));

// Default CSSTree should not throw for a generic type, because it is enabled
assert.doesNotThrow(() => cssTree.lexer.match('<length>', node));
```

> [!NOTE]
> You can find more about the generic syntax in the
> [source code](https://github.com/csstree/csstree/blob/master/lib/lexer/generic.js).

### `units`

Units that will be added to the lexer.

```js
import * as cssTree from 'css-tree';
import assert from 'assert';

const customCssTree = cssTree.fork({
    // Change time units (this will override the default time units)
    units: {
        time: ['millisecond'],
    },
});

const node = cssTree.parse('1millisecond', {
    context: 'value',
});

// Forked CSSTree should match for a valid custom type
assert.strictEqual(customCssTree.lexer.match('<time>', node).error, null);

// Default CSSTree should not match for the custom type because it is not defined
assert(cssTree.lexer.match('<time>', node).error instanceof SyntaxError);
```

> [!NOTE]
> You can find the full list of units in the
> [source code](https://github.com/csstree/csstree/blob/master/lib/lexer/units.js).

### `types`

Types that will be added to the lexer.

```js
import * as cssTree from 'css-tree';
import assert from 'assert';

const customCssTree = cssTree.fork({
    types: {
        // Type name: Definition syntax
        foo: '<bar>#',
        bar: '[ 1 | 2 | 3 ]'
    },
});

// Helper function to parse value
const parseValue = (value) => cssTree.parse(value, { context: 'value' });

// Forked CSSTree should match for a valid custom type
assert.strictEqual(customCssTree.lexer.matchType('bar', parseValue('1')).error, null);

// Forked CSSTree should not match for an invalid custom type
assert(customCssTree.lexer.matchType('bar', parseValue('4')).error instanceof SyntaxError);

// Default CSSTree should not match custom type because it is not defined
assert(cssTree.lexer.matchType('bar', parseValue('1')).error instanceof SyntaxError);
```

> [!NOTE]
> You can learn more about the definition syntax in the [documentation](./definition-syntax.md).
> You can find the full list of types in the
> [source code](https://github.com/csstree/csstree/blob/master/lib/lexer/generic.js).

### `properties`

Properties that will be added to the lexer.

```js
import * as cssTree from 'css-tree';
import assert from 'assert';

const customCssTree = cssTree.fork({
    properties: {
        custom: '<number>#',
    },
});

// Forked CSSTree should match for a valid custom property
assert.strictEqual(customCssTree.lexer.checkPropertyName('custom'), undefined);

// Default CSSTree should not match custom property because it is not defined
assert(cssTree.lexer.checkPropertyName('custom') instanceof SyntaxError);
```

> [!NOTE]
> You can learn more about the definition syntax in the [documentation](./definition-syntax.md).

### `atrules`

At-rules that will be added to the parser.

```js
import * as cssTree from 'css-tree';
import assert from 'assert';

const customCssTree = cssTree.fork({
    atrules: {
        'custom-at-rule': {
            prelude: '<number>',
        },
    },
});

// Helper function to parse value
const parseValue = (value) => cssTree.parse(value, { context: 'value' });

// Forked CSSTree should match for a valid custom at-rule
assert.strictEqual(customCssTree.lexer.checkAtruleName('custom-at-rule'), undefined);
assert.strictEqual(customCssTree.lexer.matchAtrulePrelude('custom-at-rule', parseValue('1')).error, null);
assert(customCssTree.lexer.matchAtrulePrelude('custom-at-rule', parseValue('not-a-number')).error instanceof SyntaxError);

// Default CSSTree should not match for a custom at-rule because it is not defined
assert(cssTree.lexer.checkAtruleName('custom-at-rule') instanceof SyntaxError);
assert(cssTree.lexer.matchAtrulePrelude('custom-at-rule', parseValue('1')).error instanceof SyntaxError);
```

> [!NOTE]
> You can learn more about the definition syntax in the [documentation](./definition-syntax.md).

### `node` and `pseudo`

Via these options you can add new node types and pseudo-classes to the parser. Here is a bit more complex example that
combines both options:

```js
import * as cssTree from 'css-tree';
import { inspect } from 'util';

const customCssTree = cssTree.fork({
    pseudo: {
        // Pseudo name: Descriptor object
        'custom-pseudo': {
            parse() {
                // Via the `this`, you can access the full internal state of the parser
                return this.createSingleNodeList(this.CustomNode());
            },
        },
    },
    node: {
        // Node name: Descriptor object
        CustomNode: {
            // 1. Node name
            name: 'CustomNode',

            // 2. Node structure
            structure: {
                value: String,
            },

            // 3. Parse method
            parse() {
                // Store the start position of the actual node from the token stream
                // Via the `this`, you can access the full internal state of the parser
                const startOffset = this.getTokenStart(this.tokenIndex);

                // Consume until the end of the balanced block (in this case, until the closing parenthesis)
                this.skipUntilBalanced(
                    this.tokenIndex,
                    this.consumeUntilBalanceEnd,
                );

                // Store the end position of the actual node from the token stream
                const endOffset = this.getTokenStart(this.tokenIndex);

                // Create the node
                return {
                    type: 'CustomNode',
                    loc: this.getLocation(startOffset, endOffset),
                    value: this.substring(startOffset, endOffset),
                };
            },

            // 4. Generate method (stringify the node)
            generate(node) {
                // Via the `this`, you can access the full internal state of the generator
                this.tokenize(node.value);
            },
        },
    },
});

const TEST_INPUT = ':custom-pseudo(aaa)';

// Parse the input with the forked and the default CSSTree as well.
// Forked CSSTree should parse the :custom-pseudo's value as a CustomNode,
// while the default CSSTree should parse it as a Raw node.
[cssTree, customCssTree].forEach((cssTreeInstance) => {
    console.log(
        inspect(
            cssTree.toPlainObject(
                cssTreeInstance.parse(TEST_INPUT, { context: 'selector' }),
            ),
            { depth: null, colors: true },
        ),
    );
});
```

> [!NOTE]
> You can find
>
> - built-in nodes [here](https://github.com/csstree/csstree/tree/master/lib/syntax/node)
> - built-in pseudo-classes [here](https://github.com/csstree/csstree/tree/master/lib/syntax/pseudo)
>
> You can use them as a reference for creating your own nodes and pseudo-classes.

### TODO

Need to add documentation for the following options:

- scope,
- features,
- atrule,
- parseContext

Also should mention `fork(function)` case.

> [!NOTE]
> You can view the full list of options in the
> [source code](https://github.com/csstree/csstree/blob/master/lib/syntax/config/mix.js).
