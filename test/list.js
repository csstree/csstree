var assert = require('assert');
var List = require('../lib').List;

function getFirstArg(data) {
    return data;
}

function getData(item) {
    return item.data;
}

function getIteratorState(data, item, list) {
    return {
        context: this,
        data: data,
        item: item,
        list: list
    };
}

function createIteratorStateCollector(retValue) {
    var states = [];
    return {
        states: states,
        collect: function() {
            states.push(getIteratorState.apply(this, arguments));
            return retValue;
        }
    };
}

function toArray(list) {
    var cursor = list.head;
    var prev = null;

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
    var iterate = until !== undefined
        ? list[method].bind(list, until)
        : list[method].bind(list);

    it('iterate', function() {
        var collector = createIteratorStateCollector(retValue);

        iterate(collector.collect);
        assert.deepEqual(collector.states, items.map(function(item) {
            return {
                context: list,
                list: list,
                item: item,
                data: item.data
            };
        }));
    });

    it('iterate with context', function() {
        var context = {};
        var collector = createIteratorStateCollector(retValue);

        iterate(collector.collect, context);
        assert.deepEqual(collector.states, items.map(function(item) {
            return {
                context: context,
                list: list,
                item: item,
                data: item.data
            };
        }));
    });

    it('nested iterate', function() {
        var collector = createIteratorStateCollector(retValue);

        iterate(function() {
            iterate(collector.collect);
            return retValue;
        });

        assert.deepEqual(collector.states, items.reduce(function(expected) {
            return expected.concat(items.map(function(item) {
                return {
                    context: list,
                    list: list,
                    item: item,
                    data: item.data
                };
            }));
        }, []));
    });
}

function createIteratorWithModificationTests(list, method, items, until, retValue) {
    var iterate = until !== undefined
        ? function(list) {
            var untilCopy = null;
            var cursor = list.head;

            while (cursor) {
                if (cursor.data === until.data) {
                    untilCopy = cursor;
                    break;
                }
                cursor = cursor.next;
            }

            list[method].apply(list, [untilCopy].concat(Array.prototype.slice.call(arguments, 1)));
        }
        : function(list) {
            list[method].apply(list, Array.prototype.slice.call(arguments, 1));
        };

    it('remove items on iterate', function() {
        var iterateList = list.copy();
        var removed = [];

        iterate(iterateList, function(data, item) {
            removed.push(data);
            iterateList.remove(item);
            return retValue;
        });

        assert.equal(iterateList.head, null);
        assert.deepEqual(removed, items.map(getData));
    });

    it('insert items on iterate', function() {
        var iterateList = list.copy();
        var inserted = [];
        var order = [];
        var idx = 0;

        iterate(iterateList, function(data, item) {
            if (!/^ins\d+$/.test(data)) {
                var before = List.createItem('ins' + idx);
                var after = List.createItem('ins' + idx);

                iterateList.insert(before, item);
                iterateList.insert(after, item.next);
                order.push(data);
                inserted.push(data, 'ins' + idx);
                idx++;
            }

            return retValue;
        });

        assert.deepEqual(inserted, items.reduce(function(res, item, idx) {
            return res.concat(item.data, 'ins' + idx);
        }, []));

        assert.deepEqual(iterateList.map(getFirstArg).toArray(), list.toArray().reduce(function(res, data, idx) {
            var idx = order.indexOf(data);
            return res.concat('ins' + idx, data, 'ins' + idx);
        }, []));
    });
}

describe('List', function() {
    var foo = {};
    var bar = {};
    var empty;
    var list1;
    var list2;

    beforeEach(function() {
        empty = new List();
        list1 = new List().fromArray([foo]);
        list2 = new List().fromArray([foo, bar]);
    });

    it('.createItem()', function() {
        assert.deepEqual(List.createItem(foo), {
            prev: null,
            next: null,
            data: foo
        });
    });

    it('#createItem()', function() {
        assert.deepEqual(empty.createItem(foo), {
            prev: null,
            next: null,
            data: foo
        });
    });

    it('#getSize()', function() {
        assert.equal(empty.getSize(), 0);
        assert.equal(list1.getSize(), 1);
        assert.equal(list2.getSize(), 2);
    });

    it('#fromArray()', function() {
        var list = new List().fromArray([foo, bar]);

        assert.equal(list.head.data, foo);
        assert.equal(list.tail.data, bar);
    });

    it('#toArray()', function() {
        assert.deepEqual(empty.toArray(), []);
        assert.deepEqual(list1.toArray(), [foo]);
        assert.deepEqual(list2.toArray(), [foo, bar]);
    });

    it('#toJSON()', function() {
        assert.deepEqual(empty.toJSON(), []);
        assert.deepEqual(list1.toJSON(), [foo]);
        assert.deepEqual(list2.toJSON(), [foo, bar]);
    });

    it('#isEmpty()', function() {
        assert.equal(empty.isEmpty(), true);
        assert.equal(list1.isEmpty(), false);
        assert.equal(list2.isEmpty(), false);
    });

    it('#first()', function() {
        assert.equal(empty.first(), null);
        assert.equal(list1.first(), foo);
        assert.equal(list2.first(), foo);
    });

    it('#last()', function() {
        assert.equal(empty.last(), null);
        assert.equal(list1.last(), foo);
        assert.equal(list2.last(), bar);
    });

    describe('#each()', function() {
        var iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'each', [iterateList.head, iterateList.tail]);
        createIteratorWithModificationTests(iterateList, 'each', [iterateList.head, iterateList.tail]);
    });

    describe('#forEach()', function() {
        var iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'forEach', [iterateList.head, iterateList.tail]);
        createIteratorWithModificationTests(iterateList, 'forEach', [iterateList.head, iterateList.tail]);
    });

    describe('#eachRight()', function() {
        var iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'eachRight', [iterateList.tail, iterateList.head]);
        createIteratorWithModificationTests(iterateList, 'eachRight', [iterateList.tail, iterateList.head]);
    });

    describe('#nextUntil()', function() {
        it('should not iterate when start is null', function() {
            var count = 0;

            list2.nextUntil(null, function() {
                count++;
            });

            assert.equal(count, 0);
        });

        it('should stop iterate when callback returns true', function() {
            var count = 0;

            list2.nextUntil(list2.head, function() {
                count++;
                return true;
            });

            assert.equal(count, 1);
        });

        var iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'nextUntil', [iterateList.head, iterateList.tail], iterateList.head);
        createIteratorWithModificationTests(iterateList, 'nextUntil', [iterateList.head, iterateList.tail], iterateList.head);
    });

    describe('#prevUntil()', function() {
        it('should not iterate when start is null', function() {
            var count = 0;

            list2.prevUntil(null, function() {
                count++;
            });

            assert.equal(count, 0);
        });

        it('should stop iterate when callback returns true', function() {
            var count = 0;

            list2.prevUntil(list2.tail, function() {
                count++;
                return true;
            });

            assert.equal(count, 1);
        });

        var iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'prevUntil', [iterateList.tail, iterateList.head], iterateList.tail);
        createIteratorWithModificationTests(iterateList, 'prevUntil', [iterateList.tail, iterateList.head], iterateList.tail);
    });

    describe('#some()', function() {
        it('basic', function() {
            assert.equal(list2.some(Boolean), true);
            assert.equal(list2.some(function() {}), false);
            assert.equal(list2.some(function(data) {
                return data === bar;
            }), true);
        });

        it('should stop on first match', function() {
            var count = 0;
            assert.equal(list2.some(function(data) {
                count++;
                return data === foo;
            }), true);
            assert.equal(count, 1);
        });

        var iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'some', [iterateList.head, iterateList.tail]);
    });

    describe('#map()', function() {
        it('basic', function() {
            assert.deepEqual(empty.map(getFirstArg).toArray(), []);
            assert.deepEqual(list1.map(getFirstArg).toArray(), [foo]);

            var foo2 = {};
            var bar2 = {};
            var mapped = list2.map(function(node) {
                return node === foo ? foo2 : bar2;
            });
            assert.deepEqual(mapped.toArray(), [foo2, bar2]);
            assert.deepEqual(list2.toArray(), [foo, bar]);
        });

        var iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'map', [iterateList.head, iterateList.tail]);
    });

    describe('#filter()', function() {
        it('basic', function() {
            assert.deepEqual(empty.filter(getFirstArg).toArray(), []);
            assert.deepEqual(list2.filter(Boolean).toArray(), [foo, bar]);

            var filtered = list2.filter(function(node) {
                return node === bar;
            });
            assert.deepEqual(filtered.toArray(), [bar]);
            assert.deepEqual(list2.toArray(), [foo, bar]);
        });

        var iterateList = new List().fromArray([foo, bar]);
        createIteratorTests(iterateList, 'filter', [iterateList.head, iterateList.tail]);
    });

    describe('#clear()', function() {
        it('empty list', function() {
            assert.equal(empty.head, null);
            assert.equal(empty.tail, null);
            empty.clear();
            assert.equal(empty.head, null);
            assert.equal(empty.tail, null);
        });

        it('non-empty list', function() {
            assert.notEqual(list2.head, null);
            assert.notEqual(list2.tail, null);
            list2.clear();
            assert.equal(list2.head, null);
            assert.equal(list2.tail, null);
        });
    });

    it('#copy()', function() {
        var copy = list2.copy();

        assert.notEqual(copy, list2);
        assert.notEqual(copy.head, list2.head);
        assert.equal(copy.head.data, list2.head.data);
        assert.notEqual(copy.tail, list2.tail);
        assert.equal(copy.tail.data, list2.tail.data);
    });

    it('#prepend()', function() {
        var qux = {};

        assert.deepEqual(toArray(empty.prepend(List.createItem(qux))), [qux]);
        assert.deepEqual(toArray(list1.prepend(List.createItem(qux))), [qux, foo]);
        assert.deepEqual(toArray(list2.prepend(List.createItem(qux))), [qux, foo, bar]);
        assert.equal(list2.prepend(List.createItem({})), list2);
    });

    it('#prependData()', function() {
        var qux = {};

        assert.deepEqual(toArray(empty.prependData(qux)), [qux]);
        assert.deepEqual(toArray(list1.prependData(qux)), [qux, foo]);
        assert.deepEqual(toArray(list2.prependData(qux)), [qux, foo, bar]);
        assert.equal(list2.prependData(qux), list2);
    });

    it('#unshift()', function() {
        var qux = {};

        empty.unshift(qux);
        assert.deepEqual(empty.toArray(), [qux]);

        list1.unshift(qux);
        assert.deepEqual(list1.toArray(), [qux, foo]);

        list2.unshift(qux);
        assert.deepEqual(list2.toArray(), [qux, foo, bar]);

        assert.equal(list2.unshift(qux), undefined);
    });

    describe('#shift()', function() {
        it('should remove first item', function() {
            var head = list2.head;
            var tail = list2.tail;

            assert.equal(list2.shift(), head);
            assert.equal(list2.shift(), tail);
            assert.equal(list2.head, null);
        });

        it('should return an undefined for an empty list', function() {
            assert.equal(empty.head(), undefined);
        });
    });

    it('#append()', function() {
        var qux = {};

        assert.deepEqual(toArray(empty.append(List.createItem(qux))), [qux]);
        assert.deepEqual(toArray(list1.append(List.createItem(qux))), [foo, qux]);
        assert.deepEqual(toArray(list2.append(List.createItem(qux))), [foo, bar, qux]);
        assert.equal(list2.append(List.createItem({})), list2);
    });

    it('#appendData()', function() {
        var qux = {};

        assert.deepEqual(toArray(empty.appendData(qux)), [qux]);
        assert.deepEqual(toArray(list1.appendData(qux)), [foo, qux]);
        assert.deepEqual(toArray(list2.appendData(qux)), [foo, bar, qux]);
        assert.equal(list2.appendData(qux), list2);
    });

    it('#push()', function() {
        var qux = {};

        empty.push(qux);
        assert.deepEqual(empty.toArray(), [qux]);

        list1.push(qux);
        assert.deepEqual(list1.toArray(), [foo, qux]);

        list2.push(qux);
        assert.deepEqual(list2.toArray(), [foo, bar, qux]);

        assert.equal(list2.push(qux), undefined);
    });

    describe('#pop()', function() {
        it('should remove last item', function() {
            var head = list2.head;
            var tail = list2.tail;

            assert.equal(list2.pop(), tail);
            assert.equal(list2.pop(), head);
            assert.equal(list2.head, null);
        });

        it('should return an undefined for an empty list', function() {
            assert.equal(empty.pop(), undefined);
        });
    });

    describe('#insert()', function() {
        it('should append when no ref item', function() {
            var afterTail = {};
            var res = list2.insert(List.createItem(afterTail));

            assert.equal(res, list2);
            assert.equal(list2.tail.data, afterTail);
        });

        it('should insert before ref item', function() {
            var beforeHead = {};
            var res = list2.insert(List.createItem(beforeHead), list2.head);

            assert.equal(res, list2);
            assert.equal(list2.head.data, beforeHead);
        });

        it('insert in the middle', function() {
            var qux = {};
            var inserted = List.createItem(qux);
            var list2head = list2.head;
            var list2tail = list2.tail;
            var res = list2.insert(inserted, list2.tail);

            assert.equal(res, list2);
            assert.deepEqual(list2head, {
                prev: null,
                next: inserted,
                data: foo
            });
            assert.deepEqual(inserted, {
                prev: list2head,
                next: list2tail,
                data: qux
            });
            assert.deepEqual(list2tail, {
                prev: inserted,
                next: null,
                data: bar
            });
        });

        it('insert the item before an item that doesn\'t belong to list', function() {
            var inserted = List.createItem({});

            assert.throws(function() {
                list2.insert(inserted, list1.head);
            }, /^Error: before doesn't belong to list$/);
        });
    });

    describe('#insertData()', function() {
        it('should append when no ref item', function() {
            var afterTail = {};
            var res = list2.insertData(afterTail);

            assert.equal(res, list2);
            assert.equal(list2.tail.data, afterTail);
        });

        it('should insert before ref item', function() {
            var beforeHead = {};
            var res = list2.insertData(beforeHead, list2.head);

            assert.equal(res, list2);
            assert.equal(list2.head.data, beforeHead);
        });

        it('insert in the middle', function() {
            var qux = {};
            var list2head = list2.head;
            var list2tail = list2.tail;
            var res = list2.insertData(qux, list2.tail);

            assert.equal(res, list2);
            assert.deepEqual(list2head, {
                prev: null,
                next: list2tail.prev,
                data: foo
            });
            assert.deepEqual(list2tail.prev, {
                prev: list2head,
                next: list2tail,
                data: qux
            });
            assert.deepEqual(list2tail, {
                prev: list2tail.prev,
                next: null,
                data: bar
            });
        });

        it('insert the item before an item that doesn\'t belong to list', function() {
            assert.throws(function() {
                list2.insertData({}, list1.head);
            }, /^Error: before doesn't belong to list$/);
        });
    });

    describe('#remove()', function() {
        it('clear a list', function() {
            var head = list2.head;
            var tail = list2.tail;

            list2.remove(list2.tail);
            list2.remove(list2.head);

            assert.equal(list2.head, null);
            assert.equal(list2.tail, null);
            assert.deepEqual(head, {
                prev: null,
                next: null,
                data: foo
            });
            assert.deepEqual(tail, {
                prev: null,
                next: null,
                data: bar
            });
        });

        it('clear a list in reverse order', function() {
            var head = list2.head;
            var tail = list2.tail;

            list2.remove(list2.head);
            list2.remove(list2.tail);

            assert.equal(list2.head, null);
            assert.equal(list2.tail, null);
            assert.deepEqual(head, {
                prev: null,
                next: null,
                data: foo
            });
            assert.deepEqual(tail, {
                prev: null,
                next: null,
                data: bar
            });
        });

        it('remove head item that doesn\'t belong to list', function() {
            assert.throws(function() {
                list1.remove(list2.head);
            }, /^Error: item doesn't belong to list$/);
        });

        it('remove tail item that doesn\'t belong to list', function() {
            assert.throws(function() {
                list1.remove(list2.tail);
            }, /^Error: item doesn't belong to list$/);
        });
    });

    describe('#prependList()', function() {
        it('prepend non-empty list to non-empty list', function() {
            var list1head = list1.head;
            var list2head = list2.head;
            var res = list2.prependList(list1);

            assert.equal(res, list2);
            assert.equal(list1.head, null);
            assert.equal(list2.head, list1head);
            assert.deepEqual(list1head, {
                prev: null,
                next: list2head,
                data: foo
            });
            assert.deepEqual(list2head, {
                prev: list1head,
                next: list2.tail,
                data: bar
            });
        });

        it('prepend non-empty list to empty list', function() {
            var list2head = list2.head;
            var list2tail = list2.tail;
            var res = empty.prependList(list2);

            assert.equal(res, empty);
            assert.equal(empty.head, list2head);
            assert.equal(empty.tail, list2tail);
            assert.equal(list2.head, null);
            assert.equal(list2.tail, null);
        });

        it('prepend empty list to non-empty', function() {
            var list2head = list2.head;
            var res = list2.prependList(empty);

            assert.equal(res, list2);
            assert.equal(empty.head, null);
            assert.equal(list2.head, list2head);
        });
    });

    describe('#appendList()', function() {
        it('append non-empty list to non-empty list', function() {
            var list1head = list1.head;
            var list2tail = list2.tail;
            var res = list2.appendList(list1);

            assert.equal(res, list2);
            assert.equal(list1.head, null);
            assert.equal(list2.tail, list1head);
            assert.deepEqual(list1head, {
                prev: list2tail,
                next: null,
                data: foo
            });
            assert.deepEqual(list2tail, {
                prev: list2.head,
                next: list1head,
                data: bar
            });
        });

        it('append non-empty list to empty list', function() {
            var list2head = list2.head;
            var list2tail = list2.tail;
            var res = empty.appendList(list2);

            assert.equal(res, empty);
            assert.equal(empty.head, list2head);
            assert.equal(empty.tail, list2tail);
            assert.equal(list2.head, null);
            assert.equal(list2.tail, null);
        });

        it('append empty list to non-empty', function() {
            var list2tail = list2.tail;
            var res = list2.appendList(empty);

            assert.equal(res, list2);
            assert.equal(empty.head, null);
            assert.equal(list2.tail, list2tail);
        });
    });

    describe('#insertList()', function() {
        it('add non-empty list to non-empty list', function() {
            var list1head = list1.head;
            var res = list2.insertList(list1, list2.tail);

            assert.equal(res, list2);
            assert.equal(list1.head, null);
            assert.equal(list1.tail, null);
            assert.deepEqual(list1head, {
                prev: list2.head,
                next: list2.tail,
                data: foo
            });
            assert.deepEqual(list2.head, {
                prev: null,
                next: list1head,
                data: bar
            });
            assert.deepEqual(list2.tail, {
                prev: list1head,
                next: null,
                data: bar
            });
        });

        it('add non-empty list to empty list', function() {
            var list2head = list2.head;
            var list2tail = list2.tail;
            var res = empty.insertList(list2);

            assert.equal(res, empty);
            assert.equal(empty.head, list2head);
            assert.equal(empty.tail, list2tail);
            assert.equal(list2.head, null);
            assert.equal(list2.tail, null);
        });

        it('add empty list to non-empty', function() {
            var list2tail = list2.tail;
            var res = list2.insertList(empty);

            assert.equal(res, list2);
            assert.equal(empty.head, null);
            assert.equal(list2.tail, list2tail);
        });
    });

    describe('#replace()', function() {
        it('replace for an item', function() {
            var qux = {};
            list2.replace(list2.tail, List.createItem(qux));

            assert.deepEqual(toArray(list2), [foo, qux]);
        });

        it('replace for a list', function() {
            list2.replace(list2.tail, list1);

            assert.deepEqual(toArray(list2), [foo, foo]);
        });
    });
});
