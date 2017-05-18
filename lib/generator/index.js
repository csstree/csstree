'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;

function each(processChunk, list) {
    var cursor = list.head;

    while (cursor !== null) {
        this.generate(processChunk, cursor.data, cursor, list);
        cursor = cursor.next;
    }
}

function eachComma(processChunk, list) {
    var cursor = list.head;

    while (cursor !== null) {
        if (cursor.prev) {
            processChunk(',');
        }

        this.generate(processChunk, cursor.data, cursor, list);
        cursor = cursor.next;
    }
}

function createGenerator(types) {
    var context = {
        generate: function(processChunk, node, item, list) {
            if (hasOwnProperty.call(types, node.type)) {
                types[node.type].call(this, processChunk, node, item, list);
            } else {
                throw new Error('Unknown node type: ' + node.type);
            }
        },
        each: each,
        eachComma: eachComma
    };

    return function(node, fn) {
        if (typeof fn !== 'function') {
            var buffer = [];
            context.generate(function(chunk) {
                buffer.push(chunk);
            }, node);
            return buffer.join('');
        }
        context.generate(fn, node);
    };
}

function createMarkupGenerator(types) {
    var context = {
        generate: function(buffer, node, item, list) {
            if (hasOwnProperty.call(types, node.type)) {
                var nodeBuffer = [];
                types[node.type].call(this, function(chunk) {
                    nodeBuffer.push(chunk);
                }, node, item, list);
                buffer({
                    node: node,
                    value: nodeBuffer
                });
            } else {
                throw new Error('Unknown node type: ' + node.type);
            }
        },
        each: each,
        eachComma: eachComma
    };

    return function(node, before, after) {
        function walk(node, buffer) {
            var value = node.value;

            before(node.node, buffer, value);

            if (typeof value === 'string') {
                buffer += value;
            } else {
                for (var i = 0; i < value.length; i++) {
                    if (typeof value[i] === 'string') {
                        buffer += value[i];
                    } else {
                        buffer = walk(value[i], buffer);
                    }
                }
            }

            after(node.node, buffer, value);

            return buffer;
        }

        if (typeof before !== 'function') {
            before = function() {};
        }
        if (typeof after !== 'function') {
            after = function() {};
        }

        var buffer = [];
        context.generate(function() {
            buffer.push.apply(buffer, arguments);
        }, node);
        return walk(buffer[0], '');
    };
}

module.exports = {
    createGenerator: createGenerator,
    createMarkupGenerator: createMarkupGenerator,
    sourceMap: require('./sourceMap')
};
