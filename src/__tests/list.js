import assert from 'assert';
import { List } from 'css-tree';

function getFirstArg(data) {
    return data;
}

function getData(item) {
    return item.data;
}

function getIteratorState(thisArg, data, item, list) {
    return {
        thisArg,
        data,
        item,
        list
    };
}

function createIteratorStateCollector(retValue) {
    const states = [];

    return {
        states,
        collect(...args) {
            states.push(getIteratorState(this, ...args));
            return retValue;
        }
    };
}

function toArray(list) {
    let cursor = list.head;
    let prev = null;

    while (cursor !== null) {
        if (cursor.prev !== prev) {
            throw new Error('Wrong prev reference');
        }

        if (prev !== null && prev.next !== cursor) {
            throw new Error('Wrong next reference');
        }

        prev = cursor;
        cursor = cursor.next;
    }

    if (list.tail !== prev) {
        throw new Error('Wrong tail reference');
    }

    if (prev !== null && prev.next !== null) {
        throw new Error('Wrong next reference');
    }

    return list.toArray();
}

function createIteratorTests(list, method, items, until, retValue) {
    const iterate = until !== undefined
        ? list[method].bind(list, until)
        : list[method].bind(list);

    it('iterate', () => {
        const collector = createIteratorStateCollector(retValue);

        iterate(collector.collect);
        assert.deepStrictEqual(collector.states, items.map(item =>
            getIteratorState(list, item.data, item, list)
        ));
    });

    it('iterate with thisArg', () => {
        const thisArg = {};
        const collector = createIteratorStateCollector(retValue);

        iterate(collector.collect, thisArg);
        assert.deepStrictEqual(collector.states, items.map(item =>
            getIteratorState(thisArg, item.data, item, list)
        ));
    });

    it('nested iterate', () => {
        const collector = createIteratorStateCollector(retValue);

        iterate(() => {
            iterate(collector.collect);
            return retValue;
        });

        assert.deepStrictEqual(collector.states, items.reduce(
            expected => expected.concat(items.map(item =>
                getIteratorState(list, item.data, item, list)
            )),
            []
        ));
    });
}

function createIteratorWithModificationTests(list, method, items, until, retValue) {
    const iterate = until !== undefined
        ? function(list, ...args) {
            let untilCopy = null;
            let cursor = list.head;

            while (cursor) {
                if (cursor.data === until.data) {
                    untilCopy = cursor;
                    break;
                }

                cursor = cursor.next;
            }

            list[method].apply(list, [untilCopy, ...args]);
        }
        : function(list, ...args) {
            list[method].apply(list, args);
        };

    it('remove items on iterate', () => {
        const iterateList = list.copy();
        const removed = [];

        iterate(iterateList, function(data, item) {
            removed.push(data);
            iterateList.remove(item);
            return retValue;
        });

        assert.strictEqual(iterateList.head, null);
        assert.deepStrictEqual(removed, items.map(getData));
    });

    it('insert items on iterate', () => {
        const iterateList = list.copy();
        const inserted = [];
        const order = [];
        let idx = 0;

        iterate(iterateList, function(data, item) {
            if (!/^ins\d+$/.test(data)) {
                const before = List.createItem('ins' + idx);
                const after = List.createItem('ins' + idx);

                iterateList.insert(before, item);
                iterateList.insert(after, item.next);
                order.push(data);
                inserted.push(data, 'ins' + idx);
                idx++;
            }

            return retValue;
        });

        assert.deepStrictEqual(
            inserted,
            items.reduce(
                (res, item, idx) => res.concat(item.data, 'ins' + idx),
                []
            )
        );

        assert.deepStrictEqual(
            [...iterateList],
            [...list].reduce(
                (res, data) => {
                    const idx = order.indexOf(data);
                    return res.concat('ins' + idx, data, 'ins' + idx);
                },
                []
            )
        );
    });
}

describe('List', () => {
    const foo = {};
    const bar = {};
    let empty;
    let list1;
    let list2;

    beforeEach(() => {
        empty = new List();
        list1 = new List().fromArray([foo]);
        list2 = new List().fromArray([foo, bar]);
    });

    it('.createItem()', () => {
        assert.deepStrictEqual(List.createItem(foo), {
            prev: null,
            next: null,
            data: foo
        });
    });

    it('#createItem()', () => {
        assert.deepStrictEqual(empty.createItem(foo), {
            prev: null,
            next: null,
            data: foo
        });
    });

    it('#size', () => {
        assert.strictEqual(empty.size, 0);
        assert.strictEqual(list1.size, 1);
        assert.strictEqual(list2.size, 2);
    });

    it('#fromArray()', () => {
        const list = new List().fromArray([foo, bar]);

        assert.strictEqual(list.head.data, foo);
        assert.strictEqual(list.tail.data, bar);
    });

    it('#toArray()', () => {
        assert.deepStrictEqual(empty.toArray(), []);
        assert.deepStrictEqual(list1.toArray(), [foo]);
        assert.deepStrictEqual(list2.toArray(), [foo, bar]);
    });

    it('#toJSON()', () => {
        assert.deepStrictEqual(empty.toJSON(), []);
        assert.deepStrictEqual(list1.toJSON(), [foo]);
        assert.deepStrictEqual(list2.toJSON(), [foo, bar]);
    });

    it('#isEmpty', () => {
        assert.strictEqual(empty.isEmpty, true);
        assert.strictEqual(list1.isEmpty, false);
        assert.strictEqual(list2.isEmpty, false);
    });

    it('#first', () => {
        assert.strictEqual(empty.first, null);
        assert.strictEqual(list1.first, foo);
        assert.strictEqual(list2.first, foo);
    });

    it('#last', () => {
        assert.strictEqual(empty.last, null);
        assert.strictEqual(list1.last, foo);
        assert.strictEqual(list2.last, bar);
    });

    describe('#forEach()', () => {
        const iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'forEach', [iterateList.head, iterateList.tail]);
        createIteratorWithModificationTests(iterateList, 'forEach', [iterateList.head, iterateList.tail]);
    });

    describe('#forEachRight()', () => {
        const iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'forEachRight', [iterateList.tail, iterateList.head]);
        createIteratorWithModificationTests(iterateList, 'forEachRight', [iterateList.tail, iterateList.head]);
    });

    it('#reduce()', function() {
        const expected = 'foobar';
        const actual = new List().fromArray(['foo', 'bar']).reduce((res, data) => res + data, '');

        assert.strictEqual(actual, expected);
    });

    it('#reduceRight()', function() {
        const expected = 'barfoo';
        const actual = new List().fromArray(['foo', 'bar']).reduceRight((res, data) => res + data, '');

        assert.strictEqual(actual, expected);
    });

    describe('#nextUntil()', () => {
        it('should not iterate when start is null', () => {
            let count = 0;

            list2.nextUntil(null, () => {
                count++;
            });

            assert.strictEqual(count, 0);
        });

        it('should stop iterate when callback returns true', () => {
            let count = 0;

            list2.nextUntil(list2.head, () => {
                count++;
                return true;
            });

            assert.strictEqual(count, 1);
        });

        const iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'nextUntil', [iterateList.head, iterateList.tail], iterateList.head);
        createIteratorWithModificationTests(iterateList, 'nextUntil', [iterateList.head, iterateList.tail], iterateList.head);
    });

    describe('#prevUntil()', () => {
        it('should not iterate when start is null', () => {
            let count = 0;

            list2.prevUntil(null, () => {
                count++;
            });

            assert.strictEqual(count, 0);
        });

        it('should stop iterate when callback returns true', () => {
            let count = 0;

            list2.prevUntil(list2.tail, () => {
                count++;
                return true;
            });

            assert.strictEqual(count, 1);
        });

        const iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'prevUntil', [iterateList.tail, iterateList.head], iterateList.tail);
        createIteratorWithModificationTests(iterateList, 'prevUntil', [iterateList.tail, iterateList.head], iterateList.tail);
    });

    describe('#some()', () => {
        it('basic', () => {
            assert.strictEqual(list2.some(Boolean), true);
            assert.strictEqual(list2.some(() => {}), false);
            assert.strictEqual(list2.some(function(data) {
                return data === bar;
            }), true);
        });

        it('should stop on first match', () => {
            let count = 0;
            assert.strictEqual(list2.some(function(data) {
                count++;
                return data === foo;
            }), true);
            assert.strictEqual(count, 1);
        });

        const iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'some', [iterateList.head, iterateList.tail]);
    });

    describe('#map()', () => {
        it('basic', () => {
            assert.deepStrictEqual(empty.map(getFirstArg).toArray(), []);
            assert.deepStrictEqual(list1.map(getFirstArg).toArray(), [foo]);

            const foo2 = {};
            const bar2 = {};
            const mapped = list2.map(function(node) {
                return node === foo ? foo2 : bar2;
            });
            assert.deepStrictEqual(mapped.toArray(), [foo2, bar2]);
            assert.deepStrictEqual(list2.toArray(), [foo, bar]);
        });

        const iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'map', [iterateList.head, iterateList.tail]);
    });

    describe('#filter()', () => {
        it('basic', () => {
            assert.deepStrictEqual(empty.filter(getFirstArg).toArray(), []);
            assert.deepStrictEqual(list2.filter(Boolean).toArray(), [foo, bar]);

            const filtered = list2.filter(function(node) {
                return node === bar;
            });
            assert.deepStrictEqual(filtered.toArray(), [bar]);
            assert.deepStrictEqual(list2.toArray(), [foo, bar]);
        });

        const iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'filter', [iterateList.head, iterateList.tail]);
    });

    describe('#clear()', () => {
        it('empty list', () => {
            assert.strictEqual(empty.head, null);
            assert.strictEqual(empty.tail, null);
            empty.clear();
            assert.strictEqual(empty.head, null);
            assert.strictEqual(empty.tail, null);
        });

        it('non-empty list', () => {
            assert.notStrictEqual(list2.head, null);
            assert.notStrictEqual(list2.tail, null);
            list2.clear();
            assert.strictEqual(list2.head, null);
            assert.strictEqual(list2.tail, null);
        });
    });

    it('#copy()', () => {
        const copy = list2.copy();

        assert.notStrictEqual(copy, list2);
        assert.notStrictEqual(copy.head, list2.head);
        assert.strictEqual(copy.head.data, list2.head.data);
        assert.notStrictEqual(copy.tail, list2.tail);
        assert.strictEqual(copy.tail.data, list2.tail.data);
    });

    it('#prepend()', () => {
        const qux = {};

        assert.deepStrictEqual(toArray(empty.prepend(List.createItem(qux))), [qux]);
        assert.deepStrictEqual(toArray(list1.prepend(List.createItem(qux))), [qux, foo]);
        assert.deepStrictEqual(toArray(list2.prepend(List.createItem(qux))), [qux, foo, bar]);
        assert.strictEqual(list2.prepend(List.createItem({})), list2);
    });

    it('#prependData()', () => {
        const qux = {};

        assert.deepStrictEqual(toArray(empty.prependData(qux)), [qux]);
        assert.deepStrictEqual(toArray(list1.prependData(qux)), [qux, foo]);
        assert.deepStrictEqual(toArray(list2.prependData(qux)), [qux, foo, bar]);
        assert.strictEqual(list2.prependData(qux), list2);
    });

    it('#unshift()', () => {
        const qux = {};

        empty.unshift(qux);
        assert.deepStrictEqual(empty.toArray(), [qux]);

        list1.unshift(qux);
        assert.deepStrictEqual(list1.toArray(), [qux, foo]);

        list2.unshift(qux);
        assert.deepStrictEqual(list2.toArray(), [qux, foo, bar]);

        assert.strictEqual(list2.unshift(qux), undefined);
    });

    describe('#shift()', () => {
        it('should remove first item', () => {
            const head = list2.head;
            const tail = list2.tail;

            assert.strictEqual(list2.shift(), head);
            assert.strictEqual(list2.shift(), tail);
            assert.strictEqual(list2.head, null);
        });

        it('should return an undefined for an empty list', () => {
            assert.strictEqual(empty.shift(), null);
        });
    });

    it('#append()', () => {
        const qux = {};

        assert.deepStrictEqual(toArray(empty.append(List.createItem(qux))), [qux]);
        assert.deepStrictEqual(toArray(list1.append(List.createItem(qux))), [foo, qux]);
        assert.deepStrictEqual(toArray(list2.append(List.createItem(qux))), [foo, bar, qux]);
        assert.strictEqual(list2.append(List.createItem({})), list2);
    });

    it('#appendData()', () => {
        const qux = {};

        assert.deepStrictEqual(toArray(empty.appendData(qux)), [qux]);
        assert.deepStrictEqual(toArray(list1.appendData(qux)), [foo, qux]);
        assert.deepStrictEqual(toArray(list2.appendData(qux)), [foo, bar, qux]);
        assert.strictEqual(list2.appendData(qux), list2);
    });

    it('#push()', () => {
        const qux = {};

        empty.push(qux);
        assert.deepStrictEqual(empty.toArray(), [qux]);

        list1.push(qux);
        assert.deepStrictEqual(list1.toArray(), [foo, qux]);

        list2.push(qux);
        assert.deepStrictEqual(list2.toArray(), [foo, bar, qux]);

        assert.strictEqual(list2.push(qux), undefined);
    });

    describe('#pop()', () => {
        it('should remove last item', () => {
            const head = list2.head;
            const tail = list2.tail;

            assert.strictEqual(list2.pop(), tail);
            assert.strictEqual(list2.pop(), head);
            assert.strictEqual(list2.head, null);
        });

        it('should return an undefined for an empty list', () => {
            assert.strictEqual(empty.pop(), null);
        });
    });

    describe('#insert()', () => {
        it('should append when no ref item', () => {
            const afterTail = {};
            const res = list2.insert(List.createItem(afterTail));

            assert.strictEqual(res, list2);
            assert.strictEqual(list2.tail.data, afterTail);
        });

        it('should insert before ref item', () => {
            const beforeHead = {};
            const res = list2.insert(List.createItem(beforeHead), list2.head);

            assert.strictEqual(res, list2);
            assert.strictEqual(list2.head.data, beforeHead);
        });

        it('insert in the middle', () => {
            const qux = {};
            const inserted = List.createItem(qux);
            const list2head = list2.head;
            const list2tail = list2.tail;
            const res = list2.insert(inserted, list2.tail);

            assert.strictEqual(res, list2);
            assert.deepStrictEqual(list2head, {
                prev: null,
                next: inserted,
                data: foo
            });
            assert.deepStrictEqual(inserted, {
                prev: list2head,
                next: list2tail,
                data: qux
            });
            assert.deepStrictEqual(list2tail, {
                prev: inserted,
                next: null,
                data: bar
            });
        });

        it('insert the item before an item that doesn\'t belong to list', () => {
            const inserted = List.createItem({});

            assert.throws(() => {
                list2.insert(inserted, list1.head);
            }, /^Error: before doesn't belong to list$/);
        });
    });

    describe('#insertData()', () => {
        it('should append when no ref item', () => {
            const afterTail = {};
            const res = list2.insertData(afterTail);

            assert.strictEqual(res, list2);
            assert.strictEqual(list2.tail.data, afterTail);
        });

        it('should insert before ref item', () => {
            const beforeHead = {};
            const res = list2.insertData(beforeHead, list2.head);

            assert.strictEqual(res, list2);
            assert.strictEqual(list2.head.data, beforeHead);
        });

        it('insert in the middle', () => {
            const qux = {};
            const list2head = list2.head;
            const list2tail = list2.tail;
            const res = list2.insertData(qux, list2.tail);

            assert.strictEqual(res, list2);
            assert.deepStrictEqual(list2head, {
                prev: null,
                next: list2tail.prev,
                data: foo
            });
            assert.deepStrictEqual(list2tail.prev, {
                prev: list2head,
                next: list2tail,
                data: qux
            });
            assert.deepStrictEqual(list2tail, {
                prev: list2tail.prev,
                next: null,
                data: bar
            });
        });

        it('insert the item before an item that doesn\'t belong to list', () => {
            assert.throws(() => {
                list2.insertData({}, list1.head);
            }, /^Error: before doesn't belong to list$/);
        });
    });

    describe('#remove()', () => {
        it('clear a list', () => {
            const head = list2.head;
            const tail = list2.tail;

            list2.remove(list2.tail);
            list2.remove(list2.head);

            assert.strictEqual(list2.head, null);
            assert.strictEqual(list2.tail, null);
            assert.deepStrictEqual(head, {
                prev: null,
                next: null,
                data: foo
            });
            assert.deepStrictEqual(tail, {
                prev: null,
                next: null,
                data: bar
            });
        });

        it('clear a list in reverse order', () => {
            const head = list2.head;
            const tail = list2.tail;

            list2.remove(list2.head);
            list2.remove(list2.tail);

            assert.strictEqual(list2.head, null);
            assert.strictEqual(list2.tail, null);
            assert.deepStrictEqual(head, {
                prev: null,
                next: null,
                data: foo
            });
            assert.deepStrictEqual(tail, {
                prev: null,
                next: null,
                data: bar
            });
        });

        it('remove head item that doesn\'t belong to list', () => {
            assert.throws(() => {
                list1.remove(list2.head);
            }, /^Error: item doesn't belong to list$/);
        });

        it('remove tail item that doesn\'t belong to list', () => {
            assert.throws(() => {
                list1.remove(list2.tail);
            }, /^Error: item doesn't belong to list$/);
        });
    });

    describe('#prependList()', () => {
        it('prepend non-empty list to non-empty list', () => {
            const list1head = list1.head;
            const list2head = list2.head;
            const res = list2.prependList(list1);

            assert.strictEqual(res, list2);
            assert.strictEqual(list1.head, null);
            assert.strictEqual(list2.head, list1head);
            assert.deepStrictEqual(list1head, {
                prev: null,
                next: list2head,
                data: foo
            });
            assert.deepStrictEqual(list2head, {
                prev: list1head,
                next: list2.tail,
                data: bar
            });
        });

        it('prepend non-empty list to empty list', () => {
            const list2head = list2.head;
            const list2tail = list2.tail;
            const res = empty.prependList(list2);

            assert.strictEqual(res, empty);
            assert.strictEqual(empty.head, list2head);
            assert.strictEqual(empty.tail, list2tail);
            assert.strictEqual(list2.head, null);
            assert.strictEqual(list2.tail, null);
        });

        it('prepend empty list to non-empty', () => {
            const list2head = list2.head;
            const res = list2.prependList(empty);

            assert.strictEqual(res, list2);
            assert.strictEqual(empty.head, null);
            assert.strictEqual(list2.head, list2head);
        });
    });

    describe('#appendList()', () => {
        it('append non-empty list to non-empty list', () => {
            const list1head = list1.head;
            const list2tail = list2.tail;
            const res = list2.appendList(list1);

            assert.strictEqual(res, list2);
            assert.strictEqual(list1.head, null);
            assert.strictEqual(list2.tail, list1head);
            assert.deepStrictEqual(list1head, {
                prev: list2tail,
                next: null,
                data: foo
            });
            assert.deepStrictEqual(list2tail, {
                prev: list2.head,
                next: list1head,
                data: bar
            });
        });

        it('append non-empty list to empty list', () => {
            const list2head = list2.head;
            const list2tail = list2.tail;
            const res = empty.appendList(list2);

            assert.strictEqual(res, empty);
            assert.strictEqual(empty.head, list2head);
            assert.strictEqual(empty.tail, list2tail);
            assert.strictEqual(list2.head, null);
            assert.strictEqual(list2.tail, null);
        });

        it('append empty list to non-empty', () => {
            const list2tail = list2.tail;
            const res = list2.appendList(empty);

            assert.strictEqual(res, list2);
            assert.strictEqual(empty.head, null);
            assert.strictEqual(list2.tail, list2tail);
        });
    });

    describe('#insertList()', () => {
        it('add non-empty list to non-empty list', () => {
            const list1head = list1.head;
            const res = list2.insertList(list1, list2.tail);

            assert.strictEqual(res, list2);
            assert.strictEqual(list1.head, null);
            assert.strictEqual(list1.tail, null);
            assert.deepStrictEqual(list1head, {
                prev: list2.head,
                next: list2.tail,
                data: foo
            });
            assert.deepStrictEqual(list2.head, {
                prev: null,
                next: list1head,
                data: bar
            });
            assert.deepStrictEqual(list2.tail, {
                prev: list1head,
                next: null,
                data: bar
            });
        });

        it('add non-empty list to empty list', () => {
            const list2head = list2.head;
            const list2tail = list2.tail;
            const res = empty.insertList(list2);

            assert.strictEqual(res, empty);
            assert.strictEqual(empty.head, list2head);
            assert.strictEqual(empty.tail, list2tail);
            assert.strictEqual(list2.head, null);
            assert.strictEqual(list2.tail, null);
        });

        it('add empty list to non-empty', () => {
            const list2tail = list2.tail;
            const res = list2.insertList(empty);

            assert.strictEqual(res, list2);
            assert.strictEqual(empty.head, null);
            assert.strictEqual(list2.tail, list2tail);
        });
    });

    describe('#replace()', () => {
        it('replace for an item', () => {
            const qux = {};
            list2.replace(list2.tail, List.createItem(qux));

            assert.deepStrictEqual(toArray(list2), [foo, qux]);
        });

        it('replace for a list', () => {
            list2.replace(list2.tail, list1);

            assert.deepStrictEqual(toArray(list2), [foo, foo]);
        });
    });
});
