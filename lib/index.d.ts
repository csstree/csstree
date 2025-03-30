/**
 * @fileoverview Type definitions for @eslint/css-tree
 * @author ScriptHunter7
 * @license MIT
 * Based on https://github.com/scripthunter7/DefinitelyTyped/blob/master/types/css-tree/index.d.ts
 */

/*
 * MIT License
 * Copyright (c) Microsoft Corporation.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE
 */


// FIXME: Custom context / nodes for every fork, maybe add a template for internal context

// ----------------------------------------------------------
// CSS Locations
// ----------------------------------------------------------

/**
 * Represents a location within a CSS source.
 */
export interface CssLocation {
    /**
     * The 0-indexed character offset from the beginning of the source.
     */
    offset: number;

    /**
     * The 1-indexed line number.
     */
    line: number;

    /**
     * The 1-indexed column number.
     */
    column: number;
}

/**
 * Represents a range of locations within a CSS source.
 */
export interface CssLocationRange {
    /**
     * The source file name. If not provided, it will be set to `<unknown>`.
     */
    source: string;

    /**
     * The starting location of the range.
     */
    start: CssLocation;

    /**
     * The ending location of the range.
     */
    end: CssLocation;
}

// ----------------------------------------------------------
// Linked list utils
// https://github.com/csstree/csstree/blob/master/lib/utils/List.js
// ----------------------------------------------------------

/**
 * Represents an item in a linked list.
 *
 * @template TData - The type of data stored in the item.
 */
export interface ListItem<TData> {
    /**
     * The previous item in the list.
     */
    prev: ListItem<TData> | null;

    /**
     * The next item in the list.
     */
    next: ListItem<TData> | null;

    /**
     * The data stored in the item.
     */
    data: TData;
}

/**
 * A callback function used for iterating over a list.
 *
 * @template TData - The type of data in the list.
 * @template TResult - The type of the result returned by the function.
 * @template TContext - The type of the context object passed to the function. Defaults to List<TData>.
 *
 * @param {TData} item - The current item being iterated over.
 * @param {ListItem<TData>} node - The list item associated with the current item.
 * @param {List<TData>} list - The list being iterated over.
 * @returns {TResult} The result of the function.
 */
export type IteratorFn<TData, TResult, TContext = List<TData>> = (
    this: TContext,
    item: TData,
    node: ListItem<TData>,
    list: List<TData>,
) => TResult;

/**
 * A callback function used for filtering a list.
 *
 * @template TData - The type of data in the list.
 * @template TResult - The type of the result returned by the function, which must extend TData.
 * @template TContext - The type of the context object passed to the function. Defaults to List<TData>.
 *
 * @param {TData} item - The current item being iterated over.
 * @param {ListItem<TData>} node - The list item associated with the current item.
 * @param {List<TData>} list - The list being filtered.
 * @returns {boolean} Whether the item should be included in the filtered list.
 */
export type FilterFn<TData, TResult extends TData, TContext = List<TData>> = (
    this: TContext,
    item: TData,
    node: ListItem<TData>,
    list: List<TData>,
) => item is TResult;

/**
 * A callback function used for reducing a list to a single value.
 *
 * @template TData - The type of data in the list.
 * @template TValue - The type of the accumulator value.
 * @template TContext - The type of the context object passed to the function. Defaults to List<TData>.
 *
 * @param {TValue} accum - The accumulator value.
 * @param {TData} data - The current item being iterated over.
 * @param {ListItem<TData>} node - The list item associated with the current item.
 * @param {List<TData>} list - The list being reduced.
 * @returns {TValue} The new accumulator value.
 */
export type ReduceFn<TData, TValue, TContext = List<TData>> = (this: TContext, accum: TValue, data: TData) => TValue;

/**
 * A doubly linked list implementation.
 *
 * ```plaintext
 *                                 list
 *                               ┌──────┐
 *                ┌──────────────┼─head │
 *                │              │ tail─┼─────────────┐
 *                │              └──────┘             │
 *                ▼                                   ▼
 *              item        item        item        item
 *            ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
 *    null <──┼─prev │<───┼─prev │<───┼─prev │<───┼─prev │
 *            │ next─┼───>│ next─┼───>│ next─┼───>│ next─┼──> null
 *            ├──────┤    ├──────┤    ├──────┤    ├──────┤
 *            │ data │    │ data │    │ data │    │ data │
 *            └──────┘    └──────┘    └──────┘    └──────┘
 * ```
 *
 * @template TData - The type of data stored in the list elements.
 */
export class List<TData> {
    /**
     * Creates a new empty linked list.
     */
    constructor();

    /**
     * Static factory method for creating list items.
     *
     * @param data Item data.
     * @returns
     */
    static createItem<TData>(data: TData): ListItem<TData>;

    /**
     * Gets the number of items in the list.
     *
     * @returns {number} The number of items in the list.
     */
    get size(): number;

    /**
     * Checks if the list is empty.
     *
     * @returns {boolean} True if the list is empty, false otherwise.
     */
    get isEmpty(): boolean;

    /**
     * Gets the first item in the list.
     *
     * @returns {TData | null} The first item in the list, or null if the list is empty.
     */
    get first(): TData | null;

    /**
     * Gets the last item in the list.
     *
     * @returns {TData | null} The last item in the list, or null if the list is empty.
     */
    get last(): TData | null;

    /**
     * Returns an iterator for the list.
     *
     * @returns {IterableIterator<TData>} An iterator for the list.
     */
    [Symbol.iterator](): IterableIterator<TData>;

    /**
     * Creates a new list from an array.
     *
     * @param {TData[]} array - The array to create the list from.
     * @returns {List<TData>} The new list.
     */
    fromArray(array: TData[]): List<TData>;

    /**
     * Creates a new list item.
     *
     * @param {TData} data - The data to store in the item.
     * @returns {ListItem<TData>} The new list item.
     */
    createItem(data: TData): ListItem<TData>;

    /**
     * Converts the list to an array.
     *
     * @returns {TData[]} The list as an array.
     */
    toArray(): TData[];

    /**
     * Converts the list to a JSON array.
     *
     * @returns {TData[]} The list as a JSON array.
     */
    toJSON(): TData[];

    /**
     * Iterates over each item in the list, calling the provided callback function for each item.
     *
     * @template TContext - The type of the context object passed to the callback function.
     *
     * @param {IteratorFn<TData, void, TContext>} fn - The callback function to be called for each item.
     * @param {TContext} context - The context object to be passed to the callback function.
     */
    forEach<TContext>(fn: IteratorFn<TData, void, TContext>, context: TContext): void;
    forEach(fn: IteratorFn<TData, void>): void;

    /**
     * Iterates over each item in the list, starting from the end and moving towards the beginning, calling the provided callback function for each item.
     *
     * @template TContext - The type of the context object passed to the callback function.
     *
     * @param {IteratorFn<TData, void, TContext>} fn - The callback function to be called for each item.
     * @param {TContext} context - The context object to be passed to the callback function.
     */
    forEachRight<TContext>(fn: IteratorFn<TData, void, TContext>, context: TContext): void;
    forEachRight(fn: IteratorFn<TData, void>): void;

    /**
     * Iterates over the items in the list starting from the specified item until the provided callback function returns true.
     *
     * @template TContext - The type of the context object passed to the callback function.
     *
     * @param {ListItem<TData>} start - The starting item for the iteration.
     * @param {IteratorFn<TData, boolean, TContext>} fn - The callback function to be called for each item.
     * @param {TContext} context - The context object to be passed to the callback function.
     */
    nextUntil<TContext>(start: ListItem<TData>, fn: IteratorFn<TData, boolean, TContext>, context: TContext): void;
    nextUntil(start: ListItem<TData>, fn: IteratorFn<TData, boolean>): void;

    /**
     * Iterates over the items in the list starting from the specified item and moving towards the beginning until the provided callback function returns true.
     *
     * @template TContext - The type of the context object passed to the callback function.
     *
     * @param {ListItem<TData>} start - The starting item for the iteration.
     * @param {IteratorFn<TData, boolean, TContext>} fn - The callback function to be called for each item.
     * @param {TContext} context - The context object to be passed to the callback function.
     */
    prevUntil<TContext>(start: ListItem<TData>, fn: IteratorFn<TData, boolean, TContext>, context: TContext): void;
    prevUntil(start: ListItem<TData>, fn: IteratorFn<TData, boolean>): void;

    /**
     * Reduces the list to a single value.
     *
     * @template TValue - The type of the accumulator value.
     * @template TContext - The type of the context object passed to the callback function.
     *
     * @param {ReduceFn<TData, TValue, TContext>} fn - The callback function to be called for each item.
     * @param {TValue} initialValue - The initial value of the accumulator.
     * @param {TContext} context - The context object to be passed to the callback function.
     * @returns {TValue} The final value of the accumulator.
     */
    reduce<TValue, TContext>(fn: ReduceFn<TData, TValue, TContext>, initialValue: TValue, context: TContext): TValue;
    reduce<TValue>(fn: ReduceFn<TData, TValue>, initialValue: TValue): TValue;

    /**
     * Reduces the list to a single value, starting from the end and moving towards the beginning.
     *
     * @template TValue - The type of the accumulator value.
     * @template TContext - The type of the context object passed to the callback function.
     *
     * @param {ReduceFn<TData, TValue, TContext>} fn - The callback function to be called for each item.
     * @param {TValue} initialValue - The initial value of the accumulator.
     * @param {TContext} context - The context object to be passed to the callback function.
     * @returns {TValue} The final value of the accumulator.
     */
    reduceRight<TValue, TContext>(
        fn: ReduceFn<TData, TValue, TContext>,
        initialValue: TValue,
        context: TContext,
    ): TValue;
    reduceRight<TValue>(fn: ReduceFn<TData, TValue>, initialValue: TValue): TValue;

    /**
     * Checks if at least one item in the list satisfies the provided callback function.
     *
     * @template TContext - The type of the context object passed to the callback function.
     *
     * @param {IteratorFn<TData, boolean, TContext>} fn - The callback function to be called for each item.
     * @param {TContext} context - The context object to be passed to the callback function.
     * @returns {boolean} True if at least one item satisfies the callback function, false otherwise.
     */
    some<TContext>(fn: IteratorFn<TData, boolean, TContext>, context: TContext): boolean;
    some(fn: IteratorFn<TData, boolean>): boolean;

    /**
     * Creates a new list by applying the provided callback function to each item in the current list.
     *
     * @template TContext - The type of the context object passed to the callback function.
     * @template TResult - The type of the elements in the new list.
     *
     * @param {IteratorFn<TData, TResult, TContext>} fn - The callback function to be called for each item.
     * @param {TContext} context - The context object to be passed to the callback function.
     * @returns {List<TResult>} The new list containing the transformed elements.
     */
    map<TContext, TResult>(fn: IteratorFn<TData, TResult, TContext>, context: TContext): List<TResult>;
    map<TResult>(fn: IteratorFn<TData, TResult>): List<TResult>;

    /**
     * Creates a new list containing only the items from the current list that satisfy the provided callback function.
     *
     * @template TContext - The type of the context object passed to the callback function.
     * @template TResult - The type of the elements in the new list, which must extend TData.
     *
     * @param {FilterFn<TData, TResult, TContext>} fn - The callback function to be called for each item.
     * @param {TContext} context - The context object to be passed to the callback function.
     * @returns {List<TResult>} The new list containing the filtered elements.
     */
    filter<TContext, TResult extends TData>(fn: FilterFn<TData, TResult, TContext>, context: TContext): List<TResult>;
    filter<TResult extends TData>(fn: FilterFn<TData, TResult>): List<TResult>;
    /**
     * Creates a new list containing only the items from the current list that satisfy the provided callback function.
     *
     * @template TContext - The type of the context object passed to the callback function.
     *
     * @param {IteratorFn<TData, boolean, TContext>} fn - The callback function to be called for each item.
     * @param {TContext} context - The context object to be passed to the callback function.
     * @returns {List<TData>} The new list containing the filtered elements.
     */
    filter<TContext>(fn: IteratorFn<TData, boolean, TContext>, context: TContext): List<TData>;
    filter(fn: IteratorFn<TData, boolean>): List<TData>;


    /**
     * Removes all items from the list.
     */
    clear(): void;

    /**
     * Creates a copy of the list.
     *
     * @returns {List<TData>} A copy of the list.
     */
    copy(): List<TData>;

    /**
     * Inserts an item at the beginning of the list.
     *
     * @param {ListItem<TData>} item - The item to insert.
     * @returns {List<TData>} The list itself.
     */
    prepend(item: ListItem<TData>): List<TData>;

    /**
     * Inserts a new item at the beginning of the list.
     *
     * @param {TData} data - The data for the new item.
     * @returns {List<TData>} The list itself.
     */
    prependData(data: TData): List<TData>;

    /**
     * Inserts an item at the end of the list.
     *
     * @param {ListItem<TData>} item - The item to insert.
     * @returns {List<TData>} The list itself.
     */
    append(item: ListItem<TData>): List<TData>;

    /**
     * Inserts a new item at the end of the list.
     *
     * @param {TData} data - The data for the new item.
     * @returns {List<TData>} The list itself.
     */
    appendData(data: TData): List<TData>;

    /**
     * Inserts an item before the specified item in the list.
     *
     * @param {ListItem<TData>} item - The item to insert.
     * @param {ListItem<TData>} before - The item before which to insert the new item.
     * @returns {List<TData>} The list itself.
     */
    insert(item: ListItem<TData>, before: ListItem<TData>): List<TData>;

    /**
     * Inserts a new item before the specified item in the list.
     *
     * @param {TData} data - The data for the new item.
     * @param {ListItem<TData>} before - The item before which to insert the new item.
     * @returns {List<TData>} The list itself.
     */
    insertData(data: TData, before: ListItem<TData>): List<TData>;

    /**
     * Removes an item from the list.
     *
     * @param {ListItem<TData>} item - The item to remove.
     * @returns {ListItem<TData>} The removed item, or null if the item was not found.
     */
    remove(item: ListItem<TData>): ListItem<TData>;

    /**
     * Adds an item to the end of the list.
     *
     * @param {TData} item - The item to add.
     */
    push(item: TData): void;

    /**
     * Removes the last item from the list and returns it.
     *
     * @returns {ListItem<TData> | undefined} The removed item, or undefined if the list is empty.
     */
    pop(): ListItem<TData> | undefined;

    /**
     * Adds an item to the beginning of the list.
     *
     * @param {TData} data - The data for the new item.
     */
    unshift(data: TData): void;

    /**
     * Removes the first item from the list and returns it.
     *
     * @returns {ListItem<TData> | undefined} The removed item, or undefined if the list is empty.
     */
    shift(): ListItem<TData> | undefined;

    /**
     * Inserts a list at the beginning of this list.
     *
     * @param {List<TData>} list - The list to insert.
     * @returns {List<TData>} The list itself.
     */
    prependList(list: List<TData>): List<TData>;

    /**
     * Inserts a list at the end of this list.
     *
     * @param {List<TData>} list - The list to insert.
     * @returns {List<TData>} The list itself.
     */
    appendList(list: List<TData>): List<TData>;

    /**
     * Inserts a list before the specified item in this list.
     *
     * @param {List<TData>} list - The list to insert.
     * @param {ListItem<TData>} before - The item before which to insert the new list.
     * @returns {List<TData>} The list itself.
     */
    insertList(list: List<TData>, before: ListItem<TData>): List<TData>;

    /**
     * Replaces an item in the list with another item or list.
     *
     * @param {ListItem<TData>} oldItem - The item to replace.
     * @param {List<TData> | ListItem<TData>} newItemOrList - The new item or list to insert.
     * @returns {List<TData>} The list itself.
     */
    replace(oldItem: ListItem<TData>, newItemOrList: List<TData> | ListItem<TData>): List<TData>;
}

// ----------------------------------------------------------
// CSS Nodes
// ----------------------------------------------------------

export interface CssNodeCommon {
    type: string;
    loc?: CssLocationRange | undefined;
}

export interface AnPlusB extends CssNodeCommon {
    type: "AnPlusB";
    a: string | null;
    b: string | null;
}

export interface Atrule extends CssNodeCommon {
    type: "Atrule";
    name: string;
    prelude: AtrulePrelude | Raw | null;
    block: Block | null;
}

export interface AtrulePlain extends CssNodeCommon {
    type: "Atrule";
    name: string;
    prelude: AtrulePreludePlain | Raw | null;
    block: BlockPlain | null;
}

export interface AtrulePrelude extends CssNodeCommon {
    type: "AtrulePrelude";
    children: List<CssNode>;
}

export interface AtrulePreludePlain extends CssNodeCommon {
    type: "AtrulePrelude";
    children: CssNodePlain[];
}

export interface AttributeSelector extends CssNodeCommon {
    type: "AttributeSelector";
    name: Identifier;
    matcher: string | null;
    value: StringNode | Identifier | null;
    flags: string | null;
}

export interface Block extends CssNodeCommon {
    type: "Block";
    children: List<CssNode>;
}

export interface BlockPlain extends CssNodeCommon {
    type: "Block";
    children: CssNodePlain[];
}

export interface Brackets extends CssNodeCommon {
    type: "Brackets";
    children: List<CssNode>;
}

export interface BracketsPlain extends CssNodeCommon {
    type: "Brackets";
    children: CssNodePlain[];
}

export interface CDC extends CssNodeCommon {
    type: "CDC";
}

export interface CDO extends CssNodeCommon {
    type: "CDO";
}

export interface ClassSelector extends CssNodeCommon {
    type: "ClassSelector";
    name: string;
}

export interface Combinator extends CssNodeCommon {
    type: "Combinator";
    name: string;
}

export interface Comment extends CssNodeCommon {
    type: "Comment";
    value: string;
}

export interface Condition extends CssNodeCommon {
    type: "Condition";
    kind: string;
    children: List<CssNode>;
}

export interface ConditionPlain extends CssNodeCommon {
    type: "Condition";
    kind: string;
    children: CssNodePlain[];
}

export interface Declaration extends CssNodeCommon {
    type: "Declaration";
    important: boolean | string;
    property: string;
    value: Value | Raw;
}

export interface DeclarationPlain extends CssNodeCommon {
    type: "Declaration";
    important: boolean | string;
    property: string;
    value: ValuePlain | Raw;
}

export interface DeclarationList extends CssNodeCommon {
    type: "DeclarationList";
    children: List<CssNode>;
}

export interface DeclarationListPlain extends CssNodeCommon {
    type: "DeclarationList";
    children: CssNodePlain[];
}

export interface Dimension extends CssNodeCommon {
    type: "Dimension";
    value: string;
    unit: string;
}

export interface Feature extends CssNodeCommon {
    type: "Feature";
    name: string;
    kind: string;
    value: Identifier | NumberNode | Dimension | Ratio | FunctionNode | null;
}

export interface FeatureFunction extends CssNodeCommon {
    type: "FeatureFunction";
    feature: string;
    kind: string;
    value: Declaration | Selector;
}

export interface FeatureFunctionPlain extends CssNodeCommon {
    type: "FeatureFunction";
    feature: string;
    kind: string;
    value: DeclarationPlain | SelectorPlain;
}

export interface FeatureRange extends CssNodeCommon {
    type: "FeatureRange";
    kind: string;
    left: Identifier | NumberNode | Dimension | Ratio | FunctionNode;
    leftComparison: string;
    middle: Identifier | NumberNode | Dimension | Ratio | FunctionNode;
    rightComparison: string | null;
    right: Identifier | NumberNode | Dimension | Ratio | FunctionNode | null;
}

export interface FunctionNode extends CssNodeCommon {
    type: "Function";
    name: string;
    children: List<CssNode>;
}

export interface FunctionNodePlain extends CssNodeCommon {
    type: "Function";
    name: string;
    children: CssNodePlain[];
}

export interface Hash extends CssNodeCommon {
    type: "Hash";
    value: string;
}

export interface IdSelector extends CssNodeCommon {
    type: "IdSelector";
    name: string;
}

export interface Identifier extends CssNodeCommon {
    type: "Identifier";
    name: string;
}

export interface Layer extends CssNodeCommon {
    type: "Layer";
    name: string;
}

export interface LayerList extends CssNodeCommon {
    type: "LayerList";
    children: List<Layer>;
}

export interface LayerListPlain extends CssNodeCommon {
    type: "LayerList";
    children: Layer[];
}

export interface MediaFeature extends CssNodeCommon {
    type: "MediaFeature";
    name: string;
    value: Identifier | NumberNode | Dimension | Ratio | null;
}

export interface MediaQuery extends CssNodeCommon {
    type: "MediaQuery";
    children: List<CssNode>;
}

export interface MediaQueryPlain extends CssNodeCommon {
    type: "MediaQuery";
    children: CssNodePlain[];
}

export interface MediaQueryList extends CssNodeCommon {
    type: "MediaQueryList";
    children: List<CssNode>;
}

export interface MediaQueryListPlain extends CssNodeCommon {
    type: "MediaQueryList";
    children: CssNodePlain[];
}

export interface NestingSelector extends CssNodeCommon {
    type: "NestingSelector";
}

export interface Nth extends CssNodeCommon {
    type: "Nth";
    nth: AnPlusB | Identifier;
    selector: SelectorList | null;
}

export interface NthPlain extends CssNodeCommon {
    type: "Nth";
    nth: AnPlusB | Identifier;
    selector: SelectorListPlain | null;
}

export interface NumberNode extends CssNodeCommon {
    type: "Number";
    value: string;
}

export interface Operator extends CssNodeCommon {
    type: "Operator";
    value: string;
}

export interface Parentheses extends CssNodeCommon {
    type: "Parentheses";
    children: List<CssNode>;
}

export interface ParenthesesPlain extends CssNodeCommon {
    type: "Parentheses";
    children: CssNodePlain[];
}

export interface Percentage extends CssNodeCommon {
    type: "Percentage";
    value: string;
}

export interface PseudoClassSelector extends CssNodeCommon {
    type: "PseudoClassSelector";
    name: string;
    children: List<CssNode> | null;
}

export interface PseudoClassSelectorPlain extends CssNodeCommon {
    type: "PseudoClassSelector";
    name: string;
    children: CssNodePlain[] | null;
}

export interface PseudoElementSelector extends CssNodeCommon {
    type: "PseudoElementSelector";
    name: string;
    children: List<CssNode> | null;
}

export interface PseudoElementSelectorPlain extends CssNodeCommon {
    type: "PseudoElementSelector";
    name: string;
    children: CssNodePlain[] | null;
}

export interface Ratio extends CssNodeCommon {
    type: "Ratio";
    left: string;
    right: string;
}

export interface Raw extends CssNodeCommon {
    type: "Raw";
    value: string;
}

export interface Rule extends CssNodeCommon {
    type: "Rule";
    prelude: SelectorList | Raw;
    block: Block;
}

export interface RulePlain extends CssNodeCommon {
    type: "Rule";
    prelude: SelectorListPlain | Raw;
    block: BlockPlain;
}

export interface Selector extends CssNodeCommon {
    type: "Selector";
    children: List<CssNode>;
}

export interface SelectorPlain extends CssNodeCommon {
    type: "Selector";
    children: CssNodePlain[];
}

export interface SelectorList extends CssNodeCommon {
    type: "SelectorList";
    children: List<CssNode>;
}

export interface SelectorListPlain extends CssNodeCommon {
    type: "SelectorList";
    children: CssNodePlain[];
}

export interface StringNode extends CssNodeCommon {
    type: "String";
    value: string;
}

export interface StyleSheet extends CssNodeCommon {
    type: "StyleSheet";
    children: List<CssNode>;
}

export interface SupportsDeclaration extends CssNodeCommon {
    type: "SupportsDeclaration";
    declaration: Declaration | Raw;
}

export interface StyleSheetPlain extends CssNodeCommon {
    type: "StyleSheet";
    children: CssNodePlain[];
}

export interface TypeSelector extends CssNodeCommon {
    type: "TypeSelector";
    name: string;
}

export interface UnicodeRange extends CssNodeCommon {
    type: "UnicodeRange";
    value: string;
}

export interface Url extends CssNodeCommon {
    type: "Url";
    value: string;
}

export interface Value extends CssNodeCommon {
    type: "Value";
    children: List<CssNode>;
}

export interface ValuePlain extends CssNodeCommon {
    type: "Value";
    children: CssNodePlain[];
}

export interface WhiteSpace extends CssNodeCommon {
    type: "WhiteSpace";
    value: string;
}

/* IMPORTANT! If you update this, also update `CssNodePlain` */
export type CssNode =
    | AnPlusB
    | Atrule
    | AtrulePrelude
    | AttributeSelector
    | Block
    | Brackets
    | CDC
    | CDO
    | ClassSelector
    | Combinator
    | Comment
    | Condition
    | Declaration
    | DeclarationList
    | Dimension
    | Feature
    | FeatureFunction
    | FeatureRange
    | FunctionNode
    | Hash
    | IdSelector
    | Identifier
    | Layer
    | LayerList
    | MediaFeature
    | MediaQuery
    | MediaQueryList
    | NestingSelector
    | Nth
    | NumberNode
    | Operator
    | Parentheses
    | Percentage
    | PseudoClassSelector
    | PseudoElementSelector
    | Ratio
    | Raw
    | Rule
    | Selector
    | SelectorList
    | StringNode
    | StyleSheet
    | SupportsDeclaration
    | TypeSelector
    | UnicodeRange
    | Url
    | Value
    | WhiteSpace;

/* IMPORTANT! If you update this, also update `CssNode` */
export type CssNodePlain =
    | AnPlusB
    | AtrulePlain
    | AtrulePreludePlain
    | AttributeSelector
    | BlockPlain
    | BracketsPlain
    | CDC
    | CDO
    | ClassSelector
    | Combinator
    | Comment
    | ConditionPlain
    | DeclarationPlain
    | DeclarationListPlain
    | Dimension
    | Feature
    | FeatureFunctionPlain
    | FeatureRange
    | FunctionNodePlain
    | Hash
    | IdSelector
    | Identifier
    | Layer
    | LayerListPlain
    | MediaFeature
    | MediaQueryPlain
    | MediaQueryListPlain
    | NestingSelector
    | NthPlain
    | NumberNode
    | Operator
    | ParenthesesPlain
    | Percentage
    | PseudoClassSelectorPlain
    | PseudoElementSelectorPlain
    | Ratio
    | Raw
    | RulePlain
    | SelectorPlain
    | SelectorListPlain
    | StringNode
    | StyleSheetPlain
    | SupportsDeclaration
    | TypeSelector
    | UnicodeRange
    | Url
    | ValuePlain
    | WhiteSpace;

type CssNodeNames = CssNode["type"];

type AnyCssNode = CssNode | CssNodePlain;

// ----------------------------------------------------------
// Tokenizer
// https://github.com/csstree/csstree/tree/master/lib/tokenizer
// ----------------------------------------------------------

type ReadonlyRecord<K extends keyof any, T> = Readonly<Record<K, T>>;

/**
 * A dictionary mapping token names (strings) to their corresponding numeric token types.
 */
export const tokenTypes: ReadonlyRecord<string, number>;

/**
 * An array containing all the possible token names as strings, indexed by their numeric token types.
 */
export const tokenNames: ReadonlyArray<string>;

/**
 * A callback function used during tokenization. It takes three arguments:
 *
 * @param token - The numeric type of the current token.
 * @param start - The starting index of the token in the source string.
 * @param end - The ending index (exclusive) of the token in the source string.
 */
export type CssTokenizerCallback = (token: number, start: number, end: number) => void;

/**
 * Represents the API for iterating over tokens in a CSS source string.
 */
export interface TokenIterateAPI {
    /**
     * The name of the file being parsed.
     */
    filename: string;

    /**
     * The CSS source string being tokenized.
     */
    source: string;

    /**
     * The total number of tokens in the stream.
     */
    tokenCount: number;

    /**
     * Gets the type of the token at the specified index.
     *
     * @param index - The index of the token.
     * @returns The numeric type of the token.
     */
    getTokenType(index: number): number;

    /**
     * Gets the name of the token type at the specified index.
     *
     * @param index - The index of the token.
     * @returns The string name of the token type.
     */
    getTokenTypeName(index: number): string;

    /**
     * Gets the start position of the token at the specified index.
     *
     * @param index - The index of the token.
     * @returns The starting character position of the token.
     */
    getTokenStart(index: number): number;

    /**
     * Gets the end position of the token at the specified index.
     *
     * @param index - The index of the token.
     * @returns The ending character position of the token.
     */
    getTokenEnd(index: number): number;

    /**
     * Gets the value of the token at the specified index.
     *
     * @param index - The index of the token.
     * @returns The string value of the token.
     */
    getTokenValue(index: number): string;

    /**
     * Gets a substring from the source string.
     *
     * @param start - The starting index.
     * @param end - The ending index.
     * @returns The substring from the source.
     */
    substring(start: number, end: number): string;

    /**
     * A Uint32Array containing balance information for tokens.
     */
    balance: Uint32Array;

    /**
     * Checks if a token type represents a block opener.
     *
     * @param type - The token type to check.
     * @returns True if the token type is a block opener.
     */
    isBlockOpenerTokenType(type: number): boolean;

    /**
     * Checks if a token type represents a block closer.
     *
     * @param type - The token type to check.
     * @returns True if the token type is a block closer.
     */
    isBlockCloserTokenType(type: number): boolean;

    /**
     * Gets the index of the matching pair token for a block token.
     *
     * @param index - The index of the block token.
     * @returns The index of the matching pair token.
     */
    getBlockTokenPairIndex(index: number): number;

    /**
     * Gets the location information for a position in the source.
     *
     * @param offset - The character offset in the source.
     * @returns The location information.
     */
    getLocation(offset: number): CssLocation;

    /**
     * Gets the location range information for a range in the source.
     *
     * @param start - The starting offset.
     * @param end - The ending offset.
     * @returns The location range information.
     */
    getRangeLocation(start: number, end: number): CssLocationRange;
}

/**
 * A function used to tokenize CSS source code.
 *
 * @param css - The CSS source code to tokenize.
 * @param onToken - The callback function to be called for each token found in the source code.
 */
export type TokenizeFunction = (css: string, onToken: CssTokenizerCallback) => void;

/**
 * Tokenizes a CSS source code string.
 *
 * @param css - The CSS source code to tokenize.
 * @param onToken - The callback function to be called for each token found in the source code.
 */
export const tokenize: TokenizeFunction;

export interface TokenStreamDumpEntry {
    idx: number;
    type: string;
    chunk: string;
    balance: number;
}

export type TokenStreamDump = TokenStreamDumpEntry[];

export type TokenStreamIteratorFunction = (token: number, start: number, end: number, index: number) => void;

export type TokenStreamConsumeStopFunction = (charCode: number) => number;

/**
 * This class represents a stream of tokens generated from a CSS string.
 */
export class TokenStream {
    /**
     * The original CSS source string.
     */
    readonly source: string;

    /**
     * The offset of the first character in the source string (usually 0).
     */
    readonly firstCharOffset: number;

    /**
     * A boolean flag indicating whether the end of the stream has been reached.
     */
    readonly eof: boolean;

    /**
     * The total number of tokens in the stream.
     */
    readonly tokenCount: number;

    /**
     * The index of the current token in the stream (starts at -1 before `next()` is called).
     */
    readonly tokenIndex: number;

    /**
     * The numeric type of the current token.
     */
    readonly tokenType: number;

    /**
     * The starting index of the current token in the source string.
     */
    readonly tokenStart: number;

    /**
     * The ending index (exclusive) of the current token in the source string.
     */
    readonly tokenEnd: number;

    /**
     * An internal buffer used for managing balance between opening and closing tokens.
     */
    readonly balance: Uint32Array;

    /**
     * An internal buffer used for storing token information, including type and offset.
     * The 32-bit integer at each index contains two pieces of information:
     * - The starting index (inclusive) of the token within the source string is stored in the lower 24 bits of the 32-bit integer.
     * - The numeric type of the token is stored in the upper 8 bits of the 32-bit integer.
     */
    readonly offsetAndType: Uint32Array;

    /**
     * Creates a new token stream from a CSS source string.
     *
     * @param source - The CSS source code to tokenize.
     * @param tokenize - The tokenizer function to use.
     */
    constructor(source: string, tokenize: TokenizeFunction);

    /**
     * Resets the stream to its initial state (all properties set to their default values).
     */
    reset(): void;

    /**
     * Sets a new source string and optionally a new tokenize function for the stream.
     *
     * @param source - The new CSS source code to tokenize.
     * @param tokenize - The new tokenizer function to use.
     */
    setSource(source?: string, tokenize?: TokenizeFunction): void;

    /**
     * Returns the numeric type of the token at a specific offset (relative to the current position).
     *
     * @param offset - The offset of the token to look up.
     * @returns The numeric type of the token at the specified offset.
     */
    lookupType(offset: number): number;

    /**
     * Returns the numeric type of the idx-th non-whitespace/comment token in the TokenStream. This method skips whitespace and comment tokens until it finds the specified non-whitespace/comment token.
     *
     * @param index - The index of the non-whitespace/comment token to look up (starting from 0).
     * @returns The numeric type of the idx-th non-whitespace/comment token, or EOF if the index is out of bounds or if the end of the stream is reached before the specified token is found.
     */
    lookupTypeNonSC(index: number): number;

    /**
     * Returns the starting index (inclusive) of the token at a specific offset (relative to the current position) within the TokenStream.
     *
     * @param offset - The offset from the current token's starting index. A positive offset indicates a position later in the stream, while a negative offset indicates a position earlier in the stream.
     * @returns The starting index of the token at the specified offset, or the length of the source string if the offset is out of bounds.
     */
    lookupOffset(offset: number): number;

    /**
     * Skips whitespace and comments and returns the starting index (inclusive) of the `idx`-th non-whitespace/comment token in the `TokenStream`.
     *
     * @param index - The index of the non-whitespace/comment token to look up (starting from 0).
     * @returns The starting index of the `idx`-th non-whitespace/comment token, or `EOF` if the index is out of bounds or if the end of the stream is reached before the specified token is found.
     */
    lookupOffsetNonSC(index: number): number;

    /**
     * Compares the value of the token at a specific offset with a given reference string and returns true if they match.
     *
     * @param offset - The offset from the current token's starting index. A positive offset indicates a position later in the stream, while a negative offset indicates a position earlier in the stream.
     * @param referenceStr - The reference string to compare with the token value.
     * @returns True if the token value matches the reference string, false otherwise.
     */
    lookupValue(offset: number, referenceStr: string): boolean;

    /**
     * Returns the starting index (inclusive) of the token at a specific index in the `TokenStream`.
     *
     * @param tokenIndex - The index of the token to look up (starting from 0).
     * @returns The starting index of the token at the specified index, or `EOF` if the index is out of bounds.
     */
    getTokenStart(tokenIndex: number): number;

    /**
     * Returns the substring of the source string from the specified starting index to the current token's starting index.
     *
     * @param start The starting index of the substring.
     * @returns The extracted substring.
     */
    substrToCursor(start: number): string;

    /**
     * Checks if the current position is at the edge of a balanced block (e.g., before an opening parenthesis).
     *
     * @param pos - The position to check.
     * @returns True if the position is at a balance edge, false otherwise.
     */
    isBalanceEdge(pos: number): boolean;

    /**
     * Checks if the current token (or the token at a specific offset) is a delimiter with a specific character code.
     *
     * @param code - The character code to check for.
     * @param offset - The offset from the current token's starting index (optional). If provided, the function checks the token at the specified offset instead of the current token.
     * @returns True if the token is a delimiter with the specified character code, false otherwise.
     */
    isDelim(code: number, offset: number): boolean;

    /**
     * Skips a specified number of tokens forward in the stream.
     *
     * @param tokenCount - The number of tokens to skip.
     */
    skip(tokenCount: number): void;

    /**
     * Moves the stream forward to the next token.
     */
    next(): void;

    /**
     * Skips any whitespace or comment tokens until encountering a non-whitespace/comment token.
     */
    skipSC(): void;

    /**
     * Skips tokens until a balanced block is reached, optionally stopping at a specified condition.
     *
     * @param startToken - The index of the starting token of the balanced block.
     * @param stopConsume - A function that determines whether to stop skipping tokens. It should take a character code as input and return:
     *   - 1: Stop skipping immediately.
     *   - 2: Stop skipping and include the current token.
     *   - 0: Continue skipping.
     */
    skipUntilBalanced(startToken: number, stopConsume: TokenStreamConsumeStopFunction): void;

    /**
     * Iterates over each token in the stream and calls the provided function for each token.
     *
     * @param fn - The function to be called for each token. It should take the following arguments:
     *   - token: The numeric type of the token.
     *   - start: The starting index of the token in the source string.
     *   - end: The ending index (exclusive) of the token in the source string.
     *   - index: The index of the token in the stream.
     */
    forEachToken(fn: TokenStreamIteratorFunction): void;

    /**
     * Dumps the token stream data.
     *
     * @returns An array of token stream entries.
     */
    dump(): TokenStreamDump;
}

/**
 * A class that maps offsets within a source string to their corresponding line and column numbers.
 */
export class OffsetToLocation {
    /**
     * Sets the source string and optionally the starting offset, line, and column.
     *
     * @param source - The source string.
     * @param startOffset The offset of the first character in the source string (default: 0).
     * @param startLine - The line number of the first character in the source string (default: 1).
     * @param startColumn - The column number of the first character in the source string (default: 1).
     */
    setSource(source: string, startOffset?: number, startLine?: number, startColumn?: number): void;

    /**
     * Gets the line and column numbers for a given offset within the source string.
     *
     * @param offset - The offset within the source string.
     * @param filename - The filename associated with the source string (optional).
     * @returns A {@link CssLocation} object containing the line and column numbers.
     */
    getLocation(offset: number, filename?: string): CssLocation;

    /**
     * Gets the line and column numbers for a range of offsets within the source string.
     *
     * @param start - The starting offset within the source string.
     * @param end - The ending offset within the source string (exclusive).
     * @param filename - The filename associated with the source string (optional).
     * @returns A {@link CssLocationRange} object containing the line and column numbers for the start and end positions.
     */
    getLocationRange(start: number, end: number, filename?: string): CssLocationRange;
}

// ----------------------------------------------------------
// Parser
// https://github.com/csstree/csstree/tree/master/lib/parser
// ----------------------------------------------------------

/**
 * Represents an error that occurs during CSS parsing. Extends the standard `SyntaxError`
 * to include additional details about the parsing error.
 */

/**
 * Represents a syntax error while parsing CSS code. In the actual code,
 * this is called `SyntaxError`, but that clashes with the global `SyntaxError` class.
 * This isn't exported separately but rather as a member of the `parse` function.
 */
export interface SyntaxParseError extends SyntaxError {

    /**
     * The source code where the error occurred.
     */
    source: string;

    /**
     * The character offset in the source code where the error occurred.
     */
    offset: number;

    /**
     * The line number (1-indexed) in the source code where the error occurred.
     */
    line: number;

    /**
     * The column number (1-indexed) in the source code where the error occurred.
     */
    column: number;

    /**
     * The source code fragment around the error, including a specified number of extra lines.
     * @param extraLines The number of extra lines to include in the fragment.
     * @return A string containing the source code fragment around the error.
     * This fragment includes the error line and the specified number of lines before and after it.
     */
    sourceFragment(extraLines: number): string;

    /**
     * The error message formatted with the source fragment.
     */
    readonly formattedMessage: string;
}

/**
 * A callback function invoked when a comment is encountered during parsing.
 *
 * @param value - The content of the comment.
 * @param loc - The location range of the comment in the source input.
 */
export type OnParseCommentCallback = (value: string, loc: CssLocationRange) => void;

/**
 * A callback function invoked when a parsing error occurs.
 *
 * @param error - The parsing error details as a `SyntaxParseError`.
 * @param fallbackNode - A fallback `CssNode` that can be used in place of the invalid input.
 */
export type OnParseErrorCallback = (error: SyntaxParseError, fallbackNode: CssNode) => void;

/**
 * A callback function invoked for each token encountered during parsing.
 *
 * @param token - The numeric type of the token.
 * @param start - The starting index of the token in the source string.
 * @param end - The ending index (exclusive) of the token in the source string.
 * @param index - The index of the token in the stream.
 */
export type OnTokenCallback = (this: TokenIterateAPI, token: number, start: number, end: number, index: number) => void;

/**
 * Options for controlling the behavior of the CSS parser.
 */
export interface ParseOptions {
    /**
     * The parsing context (e.g., "stylesheet", "value").
     */
    context?: string | undefined;

    /**
     * The at-rule name for parsing its prelude.
     */
    atrule?: string | undefined;

    /**
     * Whether to include position information in the parsed nodes.
     */
    positions?: boolean | undefined;

    /**
     * A callback function invoked for each comment encountered during parsing.
     */
    onComment?: OnParseCommentCallback;

    /**
     * A callback function invoked for handling parsing errors.
     */
    onParseError?: OnParseErrorCallback;

    /**
     * A callback function invoked for each token encountered during parsing.
     */
    onToken?: OnTokenCallback;

    /**
     * The name of the file being parsed, used for error reporting.
     */
    filename?: string | undefined;

    /**
     * The character offset to start parsing from in the input string.
     */
    offset?: number | undefined;

    /**
     * The line number to start parsing from in the input string.
     */
    line?: number | undefined;

    /**
     * The column number to start parsing from in the input string.
     */
    column?: number | undefined;

    /**
     * Whether to parse the prelude of at-rules.
     */
    parseAtrulePrelude?: boolean | undefined;

    /**
     * Whether to parse the prelude of rules.
     */
    parseRulePrelude?: boolean | undefined;

    /**
     * Whether to parse CSS values.
     */
    parseValue?: boolean | undefined;

    /**
     * Whether to parse custom property values.
     */
    parseCustomProperty?: boolean | undefined;
}

/**
 * Creates a new instance of a parse error.
 * @param message The error message describing the syntax error.
 * @param source The source code where the error occurred.
 * @param offset The character offset in the source code where the error occurred.
 * @param line The line number (1-indexed) in the source code where the error occurred.
 * @param column The column number (1-indexed) in the source code where the error occurred.
 * @param baseLine The base line number (1-indexed) for the error, used for relative positioning.
 * @param baseColumn The base column number (1-indexed) for the error, used for relative positioning.
 */
export type SyntaxErrorCreator = (message: string, source: string, offset: number, line: number, column: number, baseLine?: number, baseColumn?: number) => SyntaxParseError;

/**
 * A function that parses a CSS string into an abstract syntax tree (AST).
 */
export interface ParseFunction {

    /**
     * Parses a CSS source string into an abstract syntax tree (AST).
     * @param source - The CSS source string to parse.
     * @param options - Optional configuration for the parser.
     * @returns The parsed CSS as a `CssNode`.
     * @throws {CSSSyntaxError} If a parsing error occurs, this error will be thrown.
     */
    (source: string, options?: ParseOptions): CssNode;

    /**
     * The error class used for parsing errors.
     */
    SyntaxError: SyntaxErrorCreator;

    /**
     * The configuration used by the parser.
     */
    config: ParseConfig;
}

/**
 * Parses a CSS string into an abstract syntax tree (AST).
 */
export const parse: ParseFunction;

// ----------------------------------------------------------
// Generator
// https://github.com/csstree/csstree/tree/master/lib/generator
// ----------------------------------------------------------

/**
 * Handlers used during the generation of a CSS string from an abstract syntax tree (AST).
 */
export interface GenerateHandlers {
    /**
     * Handles traversal of child nodes and applies a delimiter between nodes if specified.
     *
     * @param node - The current CSS node whose children are being processed.
     * @param delimiter - An optional function invoked to add a delimiter between child nodes.
     */
    children: (node: CssNode, delimiter?: (node: CssNode) => void) => void;

    /**
     * Processes an individual CSS node and adds it to the generated output.
     *
     * @param node - The current CSS node being processed.
     */
    node: (node: CssNode) => void;

    /**
     * Adds a chunk of CSS text to the generated output.
     *
     * @param chunk - The CSS string chunk to add to the output.
     */
    chunk: (chunk: string) => void;

    /**
     * Retrieves the final generated CSS string.
     *
     * @returns The generated CSS string.
     */
    result: () => string;
}

/**
 * Specifies the mode to use during CSS generation.
 * - `"safe"`: Ensures compatibility and avoids unsafe constructs.
 * - `"spec"`: Adheres strictly to the CSS specification.
 */
export type GenerateMode = "safe" | "spec";

/**
 * Options for customizing the behavior of the CSS generator.
 */
export interface GenerateOptions {
    /**
     * Whether to include source map information in the generated output.
     */
    sourceMap?: boolean | undefined;

    /**
     * A function to decorate the `GenerateHandlers`, allowing customization
     * of the behavior during CSS generation.
     *
     * @param handlers - The default `GenerateHandlers` instance.
     * @returns A modified or new `GenerateHandlers` instance.
     */
    decorator?: ((handlers: GenerateHandlers) => GenerateHandlers) | undefined;

    /**
     * The mode to use for CSS generation. Defaults to `"safe"`.
     */
    mode?: GenerateMode | undefined;
}

/**
 * A function that generates a CSS string from an abstract syntax tree (AST).
 *
 * @param ast - The CSS abstract syntax tree to generate from.
 * @param options - Optional configuration for the generator.
 * @returns The generated CSS string.
 */
export type GenerateFunction = (ast: AnyCssNode, options?: GenerateOptions) => string;

/**
 * Generates a CSS string from an abstract syntax tree (AST).
 */
export const generate: GenerateFunction;

// ----------------------------------------------------------
// Walker
// ----------------------------------------------------------

/**
 * Represents the context in which a tree-walking traversal occurs.
 */
export interface WalkContext {
    /**
     * Stops traversal. No visitor function will be invoked once this value is
     * returned by a visitor.
     */
    break: symbol;

    /**
     * Prevents the current node from being iterated. No visitor function will
     * be invoked for its properties or children nodes. This value only affects
     * the `enter` visitor; the `leave` visitor is invoked after iterating
     * over all node's properties and children.
     */
    skip: symbol;

    /**
     * The root node of the tree being traversed.
     */
    root: AnyCssNode;

    /**
     * The current stylesheet node being visited, or `null` if not applicable.
     */
    stylesheet: StyleSheet | null;

    /**
     * The current at-rule node being visited, or `null` if not applicable.
     */
    atrule: Atrule | null;

    /**
     * The prelude of the current at-rule being visited, or `null` if not applicable.
     */
    atrulePrelude: AtrulePrelude | null;

    /**
     * The current rule node being visited, or `null` if not applicable.
     */
    rule: Rule | null;

    /**
     * The selector list of the current rule, or `null` if not applicable.
     */
    selector: SelectorList | null;

    /**
     * The block of the current rule or at-rule, or `null` if not applicable.
     */
    block: Block | null;

    /**
     * The current declaration node being visited, or `null` if not applicable.
     */
    declaration: Declaration | null;

    /**
     * The current function or pseudo-class/element node being visited,
     * or `null` if not applicable.
     */
    function: FunctionNode | PseudoClassSelector | PseudoElementSelector | null;
}

/**
 * A function called during tree traversal for entering or leaving a node.
 *
 * @param node - The current node being visited.
 * @param item - The list item corresponding to the current node.
 * @param list - The list containing the current node.
 */
export type EnterOrLeaveFn<NodeType = CssNode> = (
    this: WalkContext,
    node: NodeType,
    item: ListItem<CssNode>,
    list: List<CssNode>,
) => void;

/**
 * Options for controlling the tree-walking process without specifying a node type to visit.
 */
export interface WalkOptionsNoVisit {
    /**
     * A function to invoke when entering a node.
     */
    enter?: EnterOrLeaveFn | undefined;

    /**
     * A function to invoke when leaving a node.
     */
    leave?: EnterOrLeaveFn | undefined;

    /**
     * Whether to traverse the tree in reverse order.
     */
    reverse?: boolean | undefined;
}

/**
 * Options for controlling the tree-walking process with a specific node type to visit.
 *
 * @template NodeType - The specific type of node to visit.
 */
export interface WalkOptionsVisit<NodeType extends CssNode = CssNode> {
    /**
     * The type of node to visit during traversal.
     */
    visit: NodeType["type"];

    /**
     * A function to invoke when entering a node.
     */
    enter?: EnterOrLeaveFn<NodeType> | undefined;

    /**
     * A function to invoke when leaving a node.
     */
    leave?: EnterOrLeaveFn<NodeType> | undefined;

    /**
     * Whether to traverse the tree in reverse order.
     */
    reverse?: boolean | undefined;
}

/**
 * Combined options for tree-walking, supporting specific node types or general traversal options.
 */
export type WalkOptions = WalkOptionsVisit<CssNode> | WalkOptionsNoVisit;

/**
 * Walks through a CSS abstract syntax tree (AST) and invokes callback functions on nodes.
 */
export const walk: {
    /**
     * Performs a traversal of the given AST.
     *
     * @param ast - The CSS abstract syntax tree to traverse.
     * @param options - The options controlling the traversal process.
     */
    (ast: AnyCssNode, options: EnterOrLeaveFn | WalkOptions): void;

    /**
     * Stops traversal. No visitor function will be invoked once this value is returned by a visitor.
     */
    readonly break: symbol;

    /**
     * Prevents the current node from being iterated. No visitor function will be invoked for its properties or children
     * nodes. This value only affects the `enter` visitor.
     */
    readonly skip: symbol;
};

/**
 * A predicate function used to find specific nodes during tree traversal.
 *
 * @param node - The current node being visited.
 * @param item - The list item corresponding to the current node.
 * @param list - The list containing the current node.
 * @returns `true` if the node matches the condition; `false` otherwise.
 */
export type FindFn = (this: WalkContext, node: AnyCssNode, item: ListItem<CssNode>, list: List<CssNode>) => boolean;

/**
 * Finds the first node in the tree that matches the specified predicate function.
 *
 * @param ast - The CSS abstract syntax tree to search.
 * @param fn - The predicate function to match nodes.
 * @returns The first matching node, or `null` if no match is found.
 */
export function find(ast: AnyCssNode, fn: FindFn): AnyCssNode | null;

/**
 * Finds the last node in the tree that matches the specified predicate function.
 *
 * @param ast - The CSS abstract syntax tree to search.
 * @param fn - The predicate function to match nodes.
 * @returns The last matching node, or `null` if no match is found.
 */
export function findLast(ast: AnyCssNode, fn: FindFn): AnyCssNode | null;

/**
 * Finds all nodes in the tree that match the specified predicate function.
 *
 * @param ast - The CSS abstract syntax tree to search.
 * @param fn - The predicate function to match nodes.
 * @returns An array of all matching nodes.
 */
export function findAll(ast: AnyCssNode, fn: FindFn): AnyCssNode[];

// ----------------------------------------------------------
// Name utils
// https://github.com/csstree/csstree/blob/master/lib/utils/names.js
// ----------------------------------------------------------

/**
 * Represents a CSS property with detailed metadata, including vendor and custom information.
 */
export interface Property {
    /**
     * The base name of the property, excluding vendor prefixes or hacks.
     */
    readonly basename: string;

    /**
     * The full name of the property, including any vendor prefixes or hacks.
     */
    readonly name: string;

    /**
     * Any hack associated with the property (e.g., `_`, `*`, `$`).
     */
    readonly hack: string;

    /**
     * The vendor prefix of the property, if present (e.g., `-webkit-`).
     */
    readonly vendor: string;

    /**
     * The prefix used for the property, including vendor prefixes or hacks.
     */
    readonly prefix: string;

    /**
     * Indicates whether the property is a custom property (e.g., `--property-name`).
     */
    readonly custom: boolean;
}

/**
 * Parses a CSS property name and returns detailed metadata about the property.
 *
 * @param value - The CSS property name to parse.
 * @returns A `Property` object with metadata about the parsed property.
 */
export function property(value: string): Property;

/**
 * Represents a CSS keyword with detailed metadata, including vendor and custom information.
 */
export interface Keyword {
    /**
     * The base name of the keyword, excluding vendor prefixes.
     */
    readonly basename: string;

    /**
     * The full name of the keyword, including any vendor prefixes.
     */
    readonly name: string;

    /**
     * The vendor prefix of the keyword, if present (e.g., `-webkit-`).
     */
    readonly vendor: string;

    /**
     * The prefix used for the keyword, including vendor prefixes.
     */
    readonly prefix: string;

    /**
     * Indicates whether the keyword is a custom property.
     */
    readonly custom: boolean;
}

/**
 * Parses a CSS keyword and returns detailed metadata about the keyword.
 *
 * @param value - The CSS keyword to parse.
 * @returns A `Keyword` object with metadata about the parsed keyword.
 */
export function keyword(value: string): Keyword;

/**
 * Extracts the vendor prefix from a given string.
 *
 * @param str - The string to extract the vendor prefix from.
 * @param offset - The starting position in the string.
 * @returns The extracted vendor prefix, or an empty string if none exists.
 */
export function vendorPrefix(str: string, offset: number): string;

/**
 * Determines whether a given string represents a custom property.
 *
 * @param str - The string to check.
 * @param offset - The starting position in the string.
 * @returns `true` if the string represents a custom property, `false` otherwise.
 */
export function isCustomProperty(str: string, offset: number): boolean;

// ----------------------------------------------------------
// Clone
// https://github.com/csstree/csstree/blob/master/lib/utils/clone.js
// ----------------------------------------------------------

/**
 * Creates a deep copy of a CSS abstract syntax tree (AST) node.
 *
 * @param node - The `CssNode` to clone.
 * @returns A new `CssNode` instance that is a deep copy of the provided node.
 */
export function clone(node: CssNode): CssNode;

// ----------------------------------------------------------
// Convertor
// https://github.com/csstree/csstree/blob/master/lib/convertor/create.js
// ----------------------------------------------------------

export function fromPlainObject(node: CssNodePlain): CssNode;

export function toPlainObject(node: CssNode): CssNodePlain;

// ----------------------------------------------------------
// Definition syntax
// https://github.com/csstree/csstree/tree/master/lib/definition-syntax
// ----------------------------------------------------------

/**
 * Definition syntax AtWord node
 */
export interface DSNodeAtWord {
    type: "AtKeyword";
    name: string;
}

/**
 * Definition syntax Comma node
 */
export interface DSNodeComma {
    type: "Comma";
}

/**
 * Definition syntax Function node
 */
export interface DSNodeFunction {
    type: "Function";
    name: string;
}

export type DSNodeCombinator = "|" | "||" | "&&" | " ";

/**
 * Definition syntax Group node
 */
export interface DSNodeGroup {
    type: "Group";
    terms: DSNode[];
    combinator: DSNodeCombinator;
    disallowEmpty: boolean;
    explicit: boolean;
}

/**
 * Definition syntax Keyword node
 */
export interface DSNodeKeyword {
    type: "Keyword";
    name: string;
}

/**
 * Definition syntax Multiplier node
 */
export interface DSNodeMultiplier {
    type: "Multiplier";
    comma: boolean;
    min: number;
    max: number;
    term: DSNodeMultiplied;
}

/**
 * Definition syntax Property node
 */
export interface DSNodeProperty {
    type: "Property";
    name: string;
}

/**
 * Definition syntax String node
 */
export interface DSNodeString {
    type: "String";
    value: string;
}

/**
 * Definition syntax Token node
 */
export interface DSNodeToken {
    type: "Token";
    value: string;
}

/**
 * Definition syntax Type node options
 */
export interface DSNodeTypeOpts {
    type: "Range";
    min: number | null;
    max: number | null;
}

/**
 * Definition syntax Type node
 */
export interface DSNodeType {
    type: "Type";
    name: string;
    opts: DSNodeTypeOpts | null;
}

/**
 * Definition syntax node
 */
export type DSNode =
    | DSNodeAtWord
    | DSNodeComma
    | DSNodeFunction
    | DSNodeGroup
    | DSNodeKeyword
    | DSNodeMultiplier
    | DSNodeProperty
    | DSNodeString
    | DSNodeToken
    | DSNodeType;

/**
 * Definition syntax node compatible with a multiplier
 */
export type DSNodeMultiplied =
    | DSNodeFunction
    | DSNodeGroup
    | DSNodeKeyword
    | DSNodeProperty
    | DSNodeString
    | DSNodeType;

/**
 * Definition syntax generate options
 */
export interface DSGenerateOptions {
    forceBraces?: boolean | undefined;
    compact?: boolean | undefined;
    decorate?: ((result: string, node: DSNode) => void) | undefined;
}

/**
 * Definition syntax walk options
 */
export interface DSWalkOptions {
    enter?: DSWalkEnterOrLeaveFn | undefined;
    leave?: DSWalkEnterOrLeaveFn | undefined;
}

/**
 * Definition syntax walk callback
 */
export type DSWalkEnterOrLeaveFn = (node: DSNode) => void;

/**
 * DefinitionSyntax
 */
export interface DefinitionSyntax {
    /**
     * Generates CSS value definition syntax from an AST
     *
     * @param node - The AST
     * @param options - Options that affect generation
     *
     * @example
     *  generate({type: 'Keyword', name: 'foo'}) => 'foo'
     */
    generate(node: DSNode, options?: DSGenerateOptions): string;

    /**
     * Generates an AST from a CSS value syntax
     *
     * @param source - The CSS value syntax to parse
     *
     * @example
     *  parse('foo | bar') =>
     *    {
     *      type: 'Group',
     *      terms: [
     *        { type: 'Keyword', name: 'foo' },
     *        { type: 'Keyword', name: 'bar' }
     *      ],
     *      combinator: '|',
     *      disallowEmpty: false,
     *      explicit: false
     *    }
     */
    parse(source: string): DSNodeGroup;

    /**
     * Walks definition syntax AST
     */
    walk(node: DSNode, options: DSWalkEnterOrLeaveFn | DSWalkOptions, context?: any): void;

    /**
     * Wrapper for syntax errors
     */
    syntaxError: SyntaxError;
}

export const definitionSyntax: DefinitionSyntax;

// ----------------------------------------------------------
// Ident utils
// https://github.com/csstree/csstree/blob/master/lib/utils/ident.js
// ----------------------------------------------------------

/**
 * Utilities for encoding and decoding CSS identifiers.
 */
export const ident: {
    /**
     * Decodes a CSS identifier from its escaped form.
     *
     * @param input - The escaped CSS identifier to decode.
     * @returns The decoded identifier as a string.
     */
    decode(input: string): string;

    /**
     * Encodes a string into a valid CSS identifier, escaping special characters as necessary.
     *
     * @param input - The string to encode as a CSS identifier.
     * @returns The encoded CSS identifier.
     */
    encode(input: string): string;
};

// ----------------------------------------------------------
// String utils
// https://github.com/csstree/csstree/blob/master/lib/utils/string.js
// ----------------------------------------------------------

/**
 * Utilities for encoding and decoding CSS strings.
 */
export const string: {
    /**
     * Encodes a string into a valid CSS string, escaping special characters as necessary.
     * Optionally uses apostrophes (`'`) instead of quotation marks (`"`).
     *
     * @param input - The string to encode.
     * @param apostrophe - Whether to use apostrophes for the string. Defaults to `false`.
     * @returns The encoded CSS string.
     */
    encode(input: string, apostrophe?: boolean): string;

    /**
     * Decodes a CSS string from its escaped form.
     *
     * @param input - The escaped CSS string to decode.
     * @returns The decoded string.
     */
    decode(input: string): string;
};

// ----------------------------------------------------------
// URL utils
// https://github.com/csstree/csstree/blob/master/lib/utils/url.js
// ----------------------------------------------------------

/**
 * Utilities for encoding and decoding CSS URLs.
 */
export const url: {
    /**
     * Decodes a CSS URL from its escaped form.
     *
     * @param input - The escaped CSS URL to decode.
     * @returns The decoded URL as a string.
     */
    decode(input: string): string;

    /**
     * Encodes a string into a valid CSS URL, escaping special characters as necessary.
     *
     * @param input - The string to encode as a CSS URL.
     * @returns The encoded CSS URL.
     */
    encode(input: string): string;
};

// ----------------------------------------------------------
// Lexer
// https://github.com/csstree/csstree/blob/master/lib/lexer/Lexer.js
// ----------------------------------------------------------

/**
 * Represents an error that occurs during the syntax matching process.
 * Extends the standard `SyntaxError` with additional properties specific to CSS parsing.
 */
export class SyntaxMatchError extends SyntaxError {
    /**
     * The raw error message before formatting.
     */
    rawMessage: string;

    /**
     * The CSS syntax that was being matched when the error occurred.
     */
    syntax: string;

    /**
     * The CSS code where the mismatch occurred.
     */
    css: string;

    /**
     * The offset (character position) within the CSS string where the mismatch occurred.
     */
    mismatchOffset: number;

    /**
     * The length (number of characters) of the mismatched segment.
     */
    mismatchLength: number;

    /**
     * The overall offset (character position) from the start of the CSS input.
     */
    offset: number;

    /**
     * The line number (1-indexed) where the mismatch occurred.
     */
    line: number;

    /**
     * The column number (1-indexed) within the line where the mismatch occurred.
     */
    column: number;

    /**
     * The location range within the CSS input where the mismatch occurred.
     */
    loc: CssLocationRange;
}

/**
 * Represents an error that occurs when a reference to a syntax rule is invalid
 * or cannot be resolved. Extends the standard `SyntaxError`.
 */
export class SyntaxReferenceError extends SyntaxError {
    /**
     * The reference to the syntax rule that caused the error.
     */
    reference: string;
}

/**
 * Represents the result of a lexer match operation.
 */
export interface LexerMatchResult {
    /**
     * The matched CSS node, or `null` if no match was found.
     */
    matched: CssNode | null;

    /**
     * The number of iterations performed during the matching process.
     */
    iterations: number;

    /**
     * An error object if a matching error occurred, or `null` if no error.
     */
    error: Error | SyntaxMatchError | SyntaxReferenceError | null;

    /**
     * Retrieves the trace of matching operations for a specific node.
     *
     * @param node - The CSS node to trace.
     * @returns An array of `SyntaxDescriptor` objects or `null` if tracing is not applicable.
     */
    getTrace: (node: CssNode) => SyntaxDescriptor[] | null;

    /**
     * Checks if the specified node is a keyword.
     *
     * @param node - The CSS node to check.
     * @returns `true` if the node is a keyword, `false` otherwise.
     */
    isKeyword: (node: CssNode) => boolean;

    /**
     * Checks if the specified node matches a specific property.
     *
     * @param node - The CSS node to check.
     * @param property - The property name to match against.
     * @returns `true` if the node matches the property, `false` otherwise.
     */
    isProperty: (node: CssNode, property: string) => boolean;

    /**
     * Checks if the specified node matches a specific type.
     *
     * @param node - The CSS node to check.
     * @param type - The type name to match against.
     * @returns `true` if the node matches the type, `false` otherwise.
     */
    isType: (node: CssNode, type: string) => boolean;
}

type ConsumerFunction = (this: ParserContext, ...args: unknown[]) => CssNode;

// https://github.com/csstree/csstree/tree/master/lib/syntax/scope
/**
 * Recognizer is responsible for identifying specific patterns or constructs within the CSS syntax.
 * It provides methods to interpret and handle these constructs during parsing.
 */
// FIXME
interface Recognizer {
    /**
     * Retrieves a node based on the provided parsing context.
     *
     * @param context - The parsing context, which contains relevant state and configuration for the parser.
     * @returns A function that, when executed, produces a `CssNode`.
     */
    getNode(context: ParserContext): (this: ParserContext) => CssNode;

    // /**
    //  * Handles whitespace between CSS selectors during parsing.
    //  * Ensures that whitespace is correctly interpreted as a descendant combinator.
    //  *
    //  * @param next - The next node or token in the parsing sequence.
    //  * @param children - The list of parsed nodes, which will be modified to include a `Combinator` node if applicable.
    //  */
    // onWhiteSpace?(next: CssNode | null, children: CssNodeList): void;
}

/**
 * The `Parser` interface defines the methods and properties used for parsing CSS syntax.
 *
 * @see {@link https://github.com/csstree/csstree/blob/9de5189fadd6fb4e3a149eec0e80d6ed0d0541e5/lib/parser/create.js#L91-L293}
 */
interface Parser {
    /**
     * Indicates whether at-rule prelude parsing is enabled.
     */
    parseAtrulePrelude: boolean;

    /**
     * Indicates whether rule prelude parsing is enabled.
     */
    parseRulePrelude: boolean;

    /**
     * Indicates whether value parsing is enabled.
     */
    parseValue: boolean;

    /**
     * Indicates whether custom property parsing is enabled.
     */
    parseCustomProperty: boolean;

    /**
     * Reads a sequence of CSS nodes based on the provided recognizer.
     *
     * @param recognizer - A recognizer instance to determine node boundaries.
     * @returns A list of parsed `CssNode` objects.
     */
    readSequence(this: ParserContext, recognizer: Recognizer): List<CssNode>;

    /**
     * Consumes input until the end of a balance context is reached.
     *
     * @returns Always returns `0`.
     */
    consumeUntilBalanceEnd: (this: ParserContext) => 0;

    /**
     * Consumes input until a left curly bracket (`{`) is encountered.
     *
     * @param code - The character code to check.
     * @returns `0` or `1` depending on the outcome.
     */
    consumeUntilLeftCurlyBracket: (this: ParserContext, code: number) => 0 | 1;

    /**
     * Consumes input until a left curly bracket (`{`) or semicolon (`;`) is encountered.
     *
     * @param code - The character code to check.
     * @returns `0` or `1` depending on the outcome.
     */
    consumeUntilLeftCurlyBracketOrSemicolon: (this: ParserContext, code: number) => 0 | 1;

    /**
     * Consumes input until an exclamation mark (`!`) or semicolon (`;`) is encountered.
     *
     * @param code - The character code to check.
     * @returns `0` or `1` depending on the outcome.
     */
    consumeUntilExclamationMarkOrSemicolon: (this: ParserContext, code: number) => 0 | 1;

    /**
     * Consumes input until a semicolon (`;`) is included.
     *
     * @returns `0` or `2` depending on the outcome.
     */
    consumeUntilSemicolonIncluded: (this: ParserContext) => 0 | 2;

    /**
     * Creates a new, empty list of CSS nodes.
     *
     * @returns A new `List` of `CssNode` objects.
     */
    createList: (this: ParserContext) => List<CssNode>;

    /**
     * Creates a new list containing a single CSS node.
     *
     * @param node - The node to include in the list.
     * @returns A new `List` containing the provided node.
     */
    createSingleNodeList: (this: ParserContext, node: CssNode) => List<CssNode>;

    /**
     * Retrieves the first item from a list of CSS nodes.
     *
     * @param list - The list to process.
     * @returns The first list item, or `null` if the list is empty.
     */
    getFirstListNode: (this: ParserContext, list: List<CssNode>) => ListItem<CssNode> | null;

    /**
     * Retrieves the last item from a list of CSS nodes.
     *
     * @param list - The list to process.
     * @returns The last list item, or `null` if the list is empty.
     */
    getLastListNode: (this: ParserContext, list: List<CssNode>) => ListItem<CssNode> | null;

    /**
     * Parses input using a consumer function, with a fallback function as a backup.
     *
     * @param consumer - The primary function to parse input.
     * @param fallback - The fallback function to use if the primary function fails.
     * @returns A `CssNode` parsed from the input.
     */
    parseWithFallback: (this: ParserContext, consumer: ConsumerFunction, fallback: ConsumerFunction) => CssNode;

    /**
     * Looks up a non-whitespace token type at a given offset.
     *
     * @param offset - The offset to check.
     * @returns The token type code.
     */
    lookupNonWSType: (this: ParserContext, offset: number) => number;

    /**
     * Retrieves the character code at a specific offset.
     *
     * @param offset - The offset to check.
     * @returns The character code.
     */
    charCodeAt: (this: ParserContext, offset: number) => number;

    /**
     * Extracts a substring from the input based on the provided offsets.
     *
     * @param offsetStart - The start offset.
     * @param offsetEnd - The end offset.
     * @returns The extracted substring.
     */
    substring: (this: ParserContext, offsetStart: number, offsetEnd: number) => string;

    /**
     * Extracts a substring from the input starting at a specific point up to the cursor.
     *
     * @param start - The start offset.
     * @returns The extracted substring.
     */
    substrToCursor: (this: ParserContext, start: number) => string;

    /**
     * Compares a character at a specific offset with a given character code.
     *
     * @param offset - The offset to check.
     * @param charCode - The character code to compare against.
     * @returns `true` if the character matches, `false` otherwise.
     */
    cmpChar: (this: ParserContext, offset: number, charCode: number) => boolean;

    /**
     * Compares a substring with a given string.
     *
     * @param offsetStart - The start offset.
     * @param offsetEnd - The end offset.
     * @param str - The string to compare against.
     * @returns `true` if the substring matches, `false` otherwise.
     */
    cmpStr: (this: ParserContext, offsetStart: number, offsetEnd: number, str: string) => boolean;

    /**
     * Consumes a token of a specific type from the input.
     *
     * @param tokenType - The token type to consume.
     * @returns The consumed token value.
     */
    consume: (this: ParserContext, tokenType: number) => string;

    /**
     * Consumes a function name token from the input.
     *
     * @returns The consumed function name.
     */
    consumeFunctionName: (this: ParserContext) => string;

    /**
     * Consumes a number token from the input.
     *
     * @param type - The type of number to consume.
     * @returns The consumed number value.
     */
    consumeNumber: (this: ParserContext, type: number) => string;

    /**
     * Consumes a specific token type from the input without returning its value.
     *
     * @param tokenType - The token type to consume.
     */
    eat: (this: ParserContext, tokenType: number) => void;

    /**
     * Consumes an identifier token with a specific name.
     *
     * @param name - The name of the identifier to consume.
     */
    eatIdent: (this: ParserContext, name: string) => void;

    /**
     * Consumes a delimiter token with a specific character code.
     *
     * @param code - The character code of the delimiter to consume.
     */
    eatDelim: (this: ParserContext, code: number) => void;

    /**
     * Retrieves the location range of a specific segment of input.
     *
     * @param start - The start offset.
     * @param end - The end offset.
     * @returns The location range, or `null` if unavailable.
     */
    getLocation: (this: ParserContext, start: number, end: number) => CssLocationRange | null;

    /**
     * Retrieves the location range from a list of CSS nodes.
     *
     * @param list - The list of CSS nodes.
     * @returns The location range, or `null` if unavailable.
     */
    getLocationFromList: (this: ParserContext, list: List<CssNode>) => CssLocationRange | null;

    /**
     * Reports a parsing error with a specific message and offset.
     *
     * @param message - The error message.
     * @param offset - The offset at which the error occurred.
     */
    error: (this: ParserContext, message: string, offset: number) => void;
}

// https://github.com/csstree/csstree/blob/9de5189fadd6fb4e3a149eec0e80d6ed0d0541e5/lib/parser/create.js#L53-L80
type ParseConfig = {
    context: Record<string, ConsumerFunction | undefined>;
    atrule: Record<string, ConsumerFunction | undefined>;
    pseudo: Record<string, ConsumerFunction | undefined>;
    // node: Record<CssNodeNames, ConsumerFunction> & Record<string, ConsumerFunction | undefined>;
    node: Record<string, ConsumerFunction | undefined>;
} & Pick<SyntaxConfig, 'features' | 'scope'>;

// https://github.com/csstree/csstree/blob/9de5189fadd6fb4e3a149eec0e80d6ed0d0541e5/lib/parser/create.js#L90
type ParserContext = TokenStream
    & ParseConfig
    & { config: ParseConfig }
    & Parser
    & {
        // Anything else
        [key: string]: unknown;
    };

interface StructureDescriptor {
    type: string;
    optional?: boolean;
    parse?: (this: ParserContext) => CssNodeCommon;
    generate?: (this: ParserContext, node: CssNodeCommon) => void;
}

interface NodeSyntaxConfig<T extends CssNodeCommon = CssNodeCommon> {
    name: string;
    structure: Record<string, StructureDescriptor>;
    parse(this: ParserContext): T;
    generate(this: ParserContext, node: T): void;
    walkContext: WalkContext;
}

interface AtruleSyntax {
    prelude: string | null;
    descriptors: Record<string, string> | null;
}

// https://github.com/csstree/csstree/blob/9de5189fadd6fb4e3a149eec0e80d6ed0d0541e5/lib/syntax/config/parser.js#L7-L28
interface ParseContext {
    default: string;

    /**
     * Key is name
     * Value is context
     */
    [key: string]: string | ((options: Record<string, unknown>) => CssNode);
}

export interface SyntaxConfig<T extends CssNodeCommon = CssNodeCommon> {
    generic: boolean;
    units: Record<string, string[]>;
    types: Record<string, string>;
    properties: Record<string, string>;
    atrules: Record<string, AtruleSyntax>;
    node: Record<string, NodeSyntaxConfig<T>>;
    atrule: Record<string, { parse: ConsumerFunction; }>;
    pseudo: Record<string, { parse: ConsumerFunction; }>;
    scope: Record<string, Recognizer>;
    features: Record<string, Recognizer>;
    parseContext: ParseContext;
}

interface LexerStructureWarning {
    node: CssNode;
    message: string;
}

type StructureDocs = Record<string, string>;

type StructureCheckCallback = (node: CssNode, message: string) => void;

type StructureCheckFunction = (node: CssNode, warn: StructureCheckCallback) => void;

interface StructureData {
    docs: StructureDocs;
    check: StructureCheckFunction;
}

type Structure = Record<string, StructureData>;

/**
 * Represents a collection of tools and utilities for working with CSS syntax,
 * including parsing, generating, walking, and manipulating CSS abstract syntax trees (ASTs).
 */
interface Syntax {
    /**
     * The `Lexer` instance used for matching and validating CSS syntax.
     */
    lexer: Lexer;

    /**
     * Creates a new `Lexer` instance with the specified configuration.
     *
     * @param config - The syntax configuration object.
     * @returns A new `Lexer` instance.
     */
    createLexer: (config: SyntaxConfig) => Lexer;

    /**
     * Tokenizes a CSS string into a stream of tokens.
     */
    tokenize: TokenizeFunction;

    /**
     * Parses a CSS string into an abstract syntax tree (AST).
     */
    parse: ParseFunction;

    /**
     * Generates a CSS string from an abstract syntax tree (AST).
     */
    generate: GenerateFunction;

    /**
     * Walks through a CSS abstract syntax tree (AST) and applies a callback function to each node.
     *
     * @see {@link walk}
     */
    walk: typeof walk;

    /**
     * Finds the first node in a CSS abstract syntax tree (AST) that matches a given condition.
     *
     * @see {@link find}
     */
    find: typeof find;

    /**
     * Finds the last node in a CSS abstract syntax tree (AST) that matches a given condition.
     *
     * @see {@link findLast}
     */
    findLast: typeof findLast;

    /**
     * Finds all nodes in a CSS abstract syntax tree (AST) that match a given condition.
     *
     * @see {@link findAll}
     */
    findAll: typeof findAll;

    /**
     * Converts a plain JavaScript object into a CSS abstract syntax tree (AST).
     *
     * @see {@link fromPlainObject}
     */
    fromPlainObject: typeof fromPlainObject;

    /**
     * Converts a CSS abstract syntax tree (AST) into a plain JavaScript object.
     *
     * @see {@link toPlainObject}
     */
    toPlainObject: typeof toPlainObject;

    /**
     * Creates a new `Syntax` instance with customized or extended functionality.
     *
     * @returns A new forked `Syntax` instance.
     */
    fork: ForkFunction;
}

/**
 * Represents a match in the syntax, containing details about the type,
 * name, and corresponding syntax tree node.
 */
interface SyntaxMatch {
    /**
     * The type of the matched syntax (e.g., "Type", "Property").
     */
    type: string;

    /**
     * The name of the matched syntax rule.
     */
    name: string;

    /**
     * The syntax tree node representing the matched syntax.
     */
    syntax: DSNode;
}

/**
 * Represents a graph of syntax matches, including the match type,
 * syntax tree node, and source node.
 */
interface SyntaxMatchGraph {
    /**
     * The type of the syntax match graph (e.g., "Type", "Property").
     */
    type: string;

    /**
     * The primary match information.
     */
    match: SyntaxMatch;

    /**
     * The syntax tree node representing the match graph.
     */
    syntax: DSNode;

    /**
     * The source syntax tree node for the match graph.
     */
    source: DSNode;
}

/**
 * Describes a syntax rule or definition.
 */
type SyntaxDescriptor = {
    /**
     * The type of the syntax descriptor (e.g., "Type", "Property").
     */
    type: string;

    /**
     * The name of the syntax descriptor.
     */
    name: string;

    /**
     * The name of the parent syntax descriptor, or `null` if none exists.
     */
    parent: string | null;

    /**
     * Whether the syntax descriptor can be serialized.
     */
    serializable: boolean;

    /**
     * The syntax object associated with the descriptor.
     */
    syntax: Syntax;

    /**
     * The graph of syntax matches for this descriptor, or `null` if none exists.
     */
    match: SyntaxMatchGraph | null;

    /**
     * A reference to a graph of syntax matches, or `null` if none exists.
     */
    matchRef?: SyntaxMatchGraph | null;
};

/**
 * Represents a fragment match, including its parent list and nodes.
 */
type FragmentMatch<T extends CssNode = CssNode> = {
    /**
     * The parent list of CSS nodes containing the fragment.
     */
    parent: List<CssNode>;

    /**
     * The list of nodes that make up the fragment.
     */
    nodes: List<T>;
};

/**
 * Represents the result of validating a set of syntax rules.
 */
type LexerValidationResult = {
    /**
     * Broken types as an array of type names.
     */
    types: string[];

    /**
     * Broken properties as an array of property names.
     */
    properties: string[];
};

/**
 * The `Lexer` class is responsible for matching and validating CSS syntax.
 * It provides utilities for handling at-rules, properties, types, and general syntax.
 */
export class Lexer {
    /**
     * Creates a new `Lexer` instance.
     *
     * @param config - The syntax configuration object.
     * @param syntax - (Optional) A reference to the associated `Syntax` object.
     * @param structure - (Optional) The structure definitions for the lexer.
     */
    constructor(config: SyntaxConfig, syntax?: Syntax, structure?: Structure);

    /**
     * Checks the structure of the given CSS AST.
     *
     * @param ast - The CSS abstract syntax tree to validate.
     * @returns An array of structure warnings or `false` if the structure is valid.
     */
    checkStructure(ast: CssNode): LexerStructureWarning[] | false;

    /**
     * Creates a syntax descriptor for the given syntax string or object.
     *
     * @param syntax - The syntax definition.
     * @param type - The type of syntax (e.g., "Type", "Property").
     * @param name - The name of the syntax rule.
     * @param parent - (Optional) The parent rule, if applicable.
     * @returns A `SyntaxDescriptor` for the provided syntax.
     */
    createDescriptor(syntax: Syntax | string, type: string, name: string, parent: string | null): SyntaxDescriptor;

    /**
     * Checks if an at-rule name is valid.
     *
     * @param atruleName - The name of the at-rule.
     * @returns A `SyntaxReferenceError` if invalid, or `undefined` if valid.
     */
    checkAtruleName(atruleName: string): SyntaxReferenceError | undefined;

    /**
     * Checks if an at-rule prelude is valid.
     *
     * @param atruleName - The name of the at-rule.
     * @param prelude - The prelude content as a CSS node or string.
     * @returns A `SyntaxError` if invalid, or `undefined` if valid.
     */
    checkAtrulePrelude(atruleName: string, prelude: CssNode | string): SyntaxError | undefined;

    /**
     * Checks if an at-rule descriptor name is valid.
     *
     * @param atruleName - The name of the at-rule.
     * @param descriptorName - The name of the descriptor.
     * @returns A syntax error or `undefined` if valid.
     */
    checkAtruleDescriptorName(
        atruleName: string,
        descriptorName: string,
    ): SyntaxReferenceError | SyntaxError | undefined;

    /**
     * Checks if a property name is valid.
     *
     * @param propertyName - The name of the property.
     * @returns A `SyntaxReferenceError` if invalid, or `undefined` if valid.
     */
    checkPropertyName(propertyName: string): SyntaxReferenceError | undefined;

    /**
     * Matches an at-rule prelude against its syntax definition.
     *
     * @param atruleName - The name of the at-rule.
     * @param prelude - The prelude content.
     * @returns The match result as a `LexerMatchResult`.
     */
    matchAtrulePrelude(atruleName: string, prelude: AnyCssNode | string): LexerMatchResult;

    /**
     * Matches an at-rule descriptor value against its syntax definition.
     *
     * @param atruleName - The name of the at-rule.
     * @param descriptorName - The descriptor name.
     * @param value - The value to match.
     * @returns The match result as a `LexerMatchResult`.
     */
    matchAtruleDescriptor(atruleName: string, descriptorName: string, value: AnyCssNode | string): LexerMatchResult;

    /**
     * Matches a declaration node against its syntax definition.
     *
     * @param node - The declaration node to match.
     * @returns The match result as a `LexerMatchResult`.
     */
    matchDeclaration(node: AnyCssNode): LexerMatchResult;

    /**
     * Matches a property value against its syntax definition.
     *
     * @param propertyName - The name of the property.
     * @param value - The value to match.
     * @returns The match result as a `LexerMatchResult`.
     */
    matchProperty(propertyName: string, value: AnyCssNode | string): LexerMatchResult;

    /**
     * Matches a type value against its syntax definition.
     *
     * @param typeName - The name of the type.
     * @param value - The value to match.
     * @returns The match result as a `LexerMatchResult`.
     */
    matchType(typeName: string, value: AnyCssNode | string): LexerMatchResult;

    /**
     * Matches a generic syntax descriptor against a value.
     *
     * @param syntax - The syntax descriptor or string.
     * @param value - The value to match.
     * @returns The match result as a `LexerMatchResult`.
     */
    match(syntax: SyntaxDescriptor | string, value: AnyCssNode | string): LexerMatchResult;

    /**
     * Finds fragments of a value that match a specific syntax type and name.
     *
     * @param propertyName - The name of the property.
     * @param value - The value to search.
     * @param type - The type to match.
     * @param name - The name to match.
     * @returns An array of matching fragments.
     */
    findValueFragments(propertyName: string, value: AnyCssNode, type: string, name: string): FragmentMatch<Value>[];

    /**
     * Finds fragments of a declaration value that match a specific syntax type and name.
     *
     * @param declaration - The declaration node to search.
     * @param type - The type to match.
     * @param name - The name to match.
     * @returns An array of matching fragments.
     */
    findDeclarationValueFragments(declaration: Declaration, type: string, name: string): FragmentMatch<Value>[];

    /**
     * Finds all fragments in an AST that match a specific syntax type and name.
     *
     * @param ast - The AST to search.
     * @param type - The type to match.
     * @param name - The name to match.
     * @returns An array of matching fragments.
     */
    findAllFragments(ast: AnyCssNode, type: string, name: string): FragmentMatch[];

    /**
     * Retrieves the syntax descriptor for an at-rule.
     *
     * @param atruleName - The name of the at-rule.
     * @param fallbackBasename - (Optional) Whether to use a fallback basename.
     * @returns The syntax descriptor or `null` if not found.
     */
    getAtrule(atruleName: string, fallbackBasename?: boolean): SyntaxDescriptor | null;

    /**
     * Retrieves the prelude descriptor for an at-rule.
     *
     * @param atruleName - The name of the at-rule.
     * @param fallbackBasename - (Optional) Whether to use a fallback basename.
     * @returns The syntax descriptor or `null` if not found.
     */
    getAtrulePrelude(atruleName: string, fallbackBasename?: boolean): SyntaxDescriptor | null;

    /**
     * Retrieves the descriptor for an at-rule's property.
     *
     * @param atruleName - The name of the at-rule.
     * @param name - The property name.
     * @returns The syntax descriptor or `null` if not found.
     */
    getAtruleDescriptor(atruleName: string, name: string): SyntaxDescriptor | null;

    /**
     * Retrieves the syntax descriptor for a property.
     *
     * @param propertyName - The name of the property.
     * @param fallbackBasename - (Optional) Whether to use a fallback basename.
     * @returns The syntax descriptor or `null` if not found.
     */
    getProperty(propertyName: string, fallbackBasename?: boolean): SyntaxDescriptor | null;

    /**
     * Retrieves the syntax descriptor for a type.
     *
     * @param name - The name of the type.
     * @returns The syntax descriptor or `null` if not found.
     */
    getType(name: string): SyntaxDescriptor | null;

    /**
     * Validates the syntax rules and properties.
     *
     * @returns Validation results or `null` if everything is valid.
     */
    validate(): LexerValidationResult | null;

    /**
     * Dumps the current syntax configuration as a configuration object.
     *
     * @param syntaxAsAst - Whether to return syntax as AST.
     * @param pretty - Whether to format the output for readability.
     * @returns The syntax configuration.
     */
    dump(syntaxAsAst: Syntax, pretty: boolean): SyntaxConfig;

    /**
     * Converts the lexer to a string representation.
     *
     * @returns A string representation of the lexer.
     */
    toString(): string;
}

/**
 * Lexer instance.
 */
export const lexer: Lexer;

type SyntaxExtensionCallback = (prev: SyntaxConfig, assign?: typeof Object.assign) => SyntaxConfig;

type SyntaxExtension = Partial<SyntaxConfig> | SyntaxExtensionCallback;

type ForkFunction = (extension: SyntaxExtension) => Syntax;

export const fork: ForkFunction;
