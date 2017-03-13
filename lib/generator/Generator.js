'use strict';

var Generator = function() {
};

Generator.prototype = {
    generate: function(node, item, list) {
        if (this.type.hasOwnProperty(node.type)) {
            var ret = this.type[node.type].call(this, node, item, list);
            return typeof ret === 'string' ? ret : ret.join('');
        } else {
            throw new Error('Unknown node type: ' + node.type);
        }
    },

    each: function(list) {
        var cursor = list.head;
        var result = [];

        while (cursor !== null) {
            result.push(this.generate(cursor.data, cursor, list));
            cursor = cursor.next;
        }

        return result;
    },
    eachComma: function(list) {
        var cursor = list.head;
        var result = [];

        while (cursor !== null) {
            if (cursor.prev) {
                result.push(',', this.generate(cursor.data));
            } else {
                result.push(this.generate(cursor.data));
            }

            cursor = cursor.next;
        }

        return result;
    },

    type: {
    }
};

module.exports = Generator;
