'use strict';

var Generator = function() {
};

Generator.prototype = {
    generate: function(node, item, list) {
        if (this.type.hasOwnProperty(node.type)) {
            return this.type[node.type].call(this, node, item, list);
        } else {
            throw new Error('Unknown node type: ' + node.type);
        }
    },

    each: function(list) {
        var cursor = list.head;
        var result = '';

        if (cursor === null) {
            return result;
        }

        if (cursor === list.tail) {
            return this.generate(list.head.data, cursor, list);
        }

        while (cursor !== null) {
            result += this.generate(cursor.data, cursor, list);
            cursor = cursor.next;
        }

        return result;
    },
    eachComma: function(list) {
        var cursor = list.head;
        var result = '';

        if (cursor === null) {
            return result;
        }

        if (cursor === list.tail) {
            return this.generate(list.head.data);
        }

        while (cursor !== null) {
            if (result.length) {
                result += ',';
            }
            result += this.generate(cursor.data);
            cursor = cursor.next;
        }

        return result;
    },

    type: {
    }
};

module.exports = Generator;
