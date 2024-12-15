# List Class

The `List` class is a fundamental data structure in CSSTree, used to represent the children of AST nodes. It provides a performant way to manipulate nodes during CSS parsing and transformation by avoiding the overhead of growing arrays and reducing common mistakes when modifying a list while iterating over it.

## Table of Contents

- [Introduction](#introduction)
- [List Structure](#list-structure)
- [List Items vs. Data](#list-items-vs-data)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
  - [Static Methods](#static-methods)
  - [Instance Methods](#instance-methods)
  - [Properties](#properties)
- [Conversion Methods](#conversion-methods)
- [Traversal Methods](#traversal-methods)
- [Mutation Methods](#mutation-methods)
- [Array Compatibility](#array-compatibility)
- [Serialization](#serialization)

## Introduction

The `List` class implements a doubly linked list specifically optimized for AST node manipulation within CSSTree. By using a linked list instead of an array, it ensures efficient insertions and deletions without the need for memory reallocation or shifting elements, which can be costly with large AST.

This data structure is particularly useful when traversing and modifying the AST, as it helps avoid common pitfalls such as altering the collection while iterating over it.

## List Structure

The `List` is a doubly linked list where each element (item) contains references to its previous and next items, as well as the data (node) it holds.

```
                             List
                           ┌──────┐
            ┌──────────────┼─head │
            │              │ tail─┼──────────────┐
            │              └──────┘              │
            ▼                                    ▼
           Item        Item        Item        Item
         ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
 null ◀──┼─prev │◀───┼─prev │◀───┼─prev │◀───┼─prev │
         │ next─┼───▶│ next─┼───▶│ next─┼───▶│ next─┼──▶ null
         ├──────┤    ├──────┤    ├──────┤    ├──────┤
         │ data │    │ data │    │ data │    │ data │
         └──────┘    └──────┘    └──────┘    └──────┘
```

## List Items vs. Data

In the `List` class, each node of the list is called an **item**, which contains:

- `prev`: Reference to the previous item.
- `next`: Reference to the next item.
- `data`: The actual data (AST node).

It's crucial to understand the distinction between the **item** and the **data** it holds. When manipulating the list, operations often involve items, especially when inserting or removing elements.

## Usage Examples

### Traversing and Modifying the List

When using CSSTree's `walk()` function to traverse the AST, you interact with `List` instances:

```js
csstree.walk(ast, function(node, item, list) {
  // node: the current AST node (item.data)
  // item: the current list item
  // list: the list containing the item

  // Remove the current node
  list.remove(item);

  // Insert a new node before the current item
  const newItem = List.createItem(newNode);
  list.insert(newItem, item);

  // Alternatively, insert data directly
  list.insertData(newNode, item);

  // Insert a node after the current item
  list.insert(List.createItem(anotherNode), item.next);
});
```

## API Reference

### Static Methods

#### `List.createItem(data)`

Creates a new list item containing the provided data.

- **Parameters:**
  - `data`: The data to store in the item.
- **Returns:** A new list item.

```js
const item = List.createItem(node);
```

### Instance Methods

#### `constructor()`

Initializes a new empty `List`.

```js
const list = new List();
```

#### `createItem(data)`

Instance method to create a new list item.

- **Parameters:**
  - `data`: The data to store in the item.
- **Returns:** A new list item.

```js
const item = list.createItem(node);
```

#### `[Symbol.iterator]()`

Allows the list to be iterable using `for...of` loops.

```js
for (const node of list) {
  console.log(node);
}
```

### Properties

#### `size`

Returns the number of items in the list.

- **Type:** `number`

```js
console.log(list.size); // Outputs the size of the list
```

#### `isEmpty`

Checks if the list is empty.

- **Type:** `boolean`

```js
if (list.isEmpty) {
  // The list is empty
}
```

#### `first`

Gets the data of the first item.

- **Type:** Same as the data stored in the list.

```js
const firstNode = list.first;
```

#### `last`

Gets the data of the last item.

- **Type:** Same as the data stored in the list.

```js
const lastNode = list.last;
```

## Conversion Methods

### `fromArray(array)`

Populates the list with items created from the given array.

- **Parameters:**
  - `array`: An array of data elements.
- **Returns:** The `List` instance (for chaining).

```js
list.fromArray([node1, node2, node3]);
```

### `toArray()`

Converts the list to an array of data elements.

- **Returns:** An array of the data in the list.

```js
const nodes = list.toArray();
```

### `toJSON()`

Serializes the list to a JSON-compatible array.

- **Returns:** An array suitable for JSON serialization.

```js
const jsonString = JSON.stringify(list);
```

## Traversal Methods

### `forEach(fn, [thisArg])`

Executes a function for each item in the list, from head to tail.

- **Parameters:**
  - `fn(data, item, list)`: Function to execute for each item.
  - `thisArg` (optional): Value to use as `this` when executing `fn`.

```js
list.forEach((node, item, list) => {
  console.log(node.type);
});
```

### `forEachRight(fn, [thisArg])`

Executes a function for each item in the list, from tail to head.

```js
list.forEachRight((node, item, list) => {
  console.log(node.type);
});
```

### `reduce(fn, initialValue, [thisArg])`

Applies a function against an accumulator and each item to reduce it to a single value.

- **Parameters:**
  - `fn(accumulator, data, item, list)`: Function to execute on each item.
  - `initialValue`: Initial value for the accumulator.
  - `thisArg` (optional): Value to use as `this` when executing `fn`.

```js
const total = list.reduce((sum, node) => sum + node.value, 0);
```

### `reduceRight(fn, initialValue, [thisArg])`

Same as `reduce`, but from tail to head.

```js
const total = list.reduceRight((sum, node) => sum + node.value, 0);
```

### `some(fn, [thisArg])`

Tests whether at least one element in the list passes the test implemented by `fn`.

- **Parameters:**
  - `fn(data, item, list)`: Function to test for each element.
  - `thisArg` (optional): Value to use as `this` when executing `fn`.
- **Returns:** `true` if the callback returns a truthy value for any item; otherwise, `false`.

```js
const hasTypeA = list.some(node => node.type === 'TypeA');
```

### `map(fn, [thisArg])`

Creates a new `List` with the results of calling a function on every element.

- **Parameters:**
  - `fn(data, item, list)`: Function that produces an element of the new list.
  - `thisArg` (optional): Value to use as `this` when executing `fn`.
- **Returns:** A new `List` instance.

```js
const mappedList = list.map(node => ({ ...node, value: node.value * 2 }));
```

### `filter(fn, [thisArg])`

Creates a new `List` with all elements that pass the test implemented by `fn`.

- **Parameters:**
  - `fn(data, item, list)`: Function to test each element.
  - `thisArg` (optional): Value to use as `this` when executing `fn`.
- **Returns:** A new `List` instance.

```js
const filteredList = list.filter(node => node.isActive);
```

### `nextUntil(startItem, fn, [thisArg])`

Iterates over the list starting from `startItem`, moving forward, until `fn` returns `true`.

- **Parameters:**
  - `startItem`: The item to start from.
  - `fn(data, item, list)`: Function to execute for each item.
  - `thisArg` (optional): Value to use as `this` when executing `fn`.

```js
list.nextUntil(someItem, (node, item) => {
  if (node.type === 'StopType') return true;
  // Process node
});
```

### `prevUntil(startItem, fn, [thisArg])`

Iterates over the list starting from `startItem`, moving backward, until `fn` returns `true`.

```js
list.prevUntil(someItem, (node, item) => {
  if (node.type === 'StartType') return true;
  // Process node
});
```

## Mutation Methods

### `clear()`

Removes all items from the list.

```js
list.clear();
```

### `copy()`

Creates a shallow copy of the list.

- **Returns:** A new `List` instance.

```js
const newList = list.copy();
```

### `prepend(item)`

Inserts an item at the beginning of the list.

- **Parameters:**
  - `item`: The item to prepend.

```js
const item = List.createItem(node);
list.prepend(item);
```

### `prependData(data)`

Creates a new item with the provided data and inserts it at the beginning.

```js
list.prependData(node);
```

### `append(item)`

Inserts an item at the end of the list.

```js
const item = List.createItem(node);
list.append(item);
```

### `appendData(data)`

Creates a new item with the provided data and inserts it at the end.

```js
list.appendData(node);
```

### `insert(item, [before])`

Inserts an item into the list before the specified item.

- **Parameters:**
  - `item`: The item to insert.
  - `before` (optional): The item before which the new item will be inserted. If `null` or not provided, the item is appended to the end.

```js
const item = List.createItem(node);
list.insert(item, existingItem);
```

### `insertData(data, [before])`

Creates a new item with the provided data and inserts it before the specified item.

```js
list.insertData(node, existingItem);
```

### `remove(item)`

Removes an item from the list.

- **Parameters:**
  - `item`: The item to remove.
- **Returns:** The removed item.

```js
list.remove(existingItem);
```

### `push(data)`

Appends data to the end of the list (alias for `appendData`).

```js
list.push(node);
```

### `pop()`

Removes and returns the last item of the list.

- **Returns:** The removed item, or `null` if the list is empty.

```js
const lastItem = list.pop();
```

### `unshift(data)`

Prepends data to the beginning of the list (alias for `prependData`).

```js
list.unshift(node);
```

### `shift()`

Removes and returns the first item of the list.

- **Returns:** The removed item, or `null` if the list is empty.

```js
const firstItem = list.shift();
```

### `prependList(otherList)`

Inserts all items from `otherList` at the beginning of the list.

- **Parameters:**
  - `otherList`: The list to prepend. After the operation, `otherList` will be empty.

```js
list.prependList(anotherList);
```

### `appendList(otherList)`

Inserts all items from `otherList` at the end of the list.

```js
list.appendList(anotherList);
```

### `insertList(otherList, [before])`

Inserts all items from `otherList` into the list before the specified item.

- **Parameters:**
  - `otherList`: The list to insert. After the operation, `otherList` will be empty.
  - `before` (optional): The item before which to insert the new list.

```js
list.insertList(anotherList, existingItem);
```

### `replace(oldItem, newItemOrList)`

Replaces `oldItem` with a new item or list.

- **Parameters:**
  - `oldItem`: The item to replace.
  - `newItemOrList`: The new item or list to insert.

**Example (with a single item):**

```js
const newItem = List.createItem(newNode);
list.replace(oldItem, newItem);
```

**Example (with a list):**

```js
const newList = new List().fromArray([node1, node2]);
list.replace(oldItem, newList);
```

## Array Compatibility

The `List` class is compatible with arrays in many cases. It provides methods to convert to and from arrays, and implements iterable protocols.

**Conversion to Array:**

```js
const array = list.toArray();
```

**Conversion from Array:**

```js
list.fromArray([node1, node2, node3]);
```

**Iteration using `for...of`:**

```js
for (const node of list) {
  // Process node
}
```

**Note:** Direct index access (e.g., `list[0]`) is not supported.

## Serialization

The `List` class implements `toJSON()`, allowing it to be serialized with `JSON.stringify()`.

```js
const jsonString = JSON.stringify(list);
```
