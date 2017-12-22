'use strict';

var sourceMapGenerator = require('./sourceMap');
var hasOwnProperty = Object.prototype.hasOwnProperty;
var noop = function() {};

function processChildren(node, delimeter) {
    var list = node.children;
    var prev = null;

    if (typeof delimeter !== 'function') {
        list.forEach(this.node, this);
    } else {
        list.forEach(function(node) {
            if (prev !== null) {
                delimeter.call(this, prev);
            }

            this.node(node);
            prev = node;
        }, this);
    }

}

function createGenerator(types) {
    function processNode(node) {
        if (hasOwnProperty.call(types, node.type)) {
            types[node.type].call(this, node);
        } else {
            throw new Error('Unknown node type: ' + node.type);
        }
    }

    return function(node, fn) {
        if (typeof fn !== 'function') {
            // default generator concats all chunks in a single string
            var buffer = [];

            processNode.call({
                children: processChildren,
                node: processNode,
                chunk: function(chunk) {
                    buffer.push(chunk);
                }
            }, node);

            return buffer.join('');
        }

        processNode.call({
            children: processChildren,
            node: processNode,
            chunk: fn
        }, node);
    };
}

function createMarkupGenerator(types) {
    return function(node, enter, leave) {
        function processNode(node) {
            if (hasOwnProperty.call(types, node.type)) {
                var oldBuffer = buffer;
                var newBuffer = [];

                buffer = newBuffer;
                types[node.type].call(this, node);
                buffer = oldBuffer;

                this.chunk({
                    node: node,
                    value: newBuffer
                });
            } else {
                throw new Error('Unknown node type: ' + node.type);
            }
        }
        function updatePos(str) {
            for (var i = 0; i < str.length; i++) {
                if (str.charCodeAt(i) === 10) { // \n
                    line++;
                    column = 0;
                } else {
                    column++;
                }
            }

            return str;
        }

        function walk(node, buffer) {
            var value = node.value;

            enter(node.node, buffer, line, column);

            if (typeof value === 'string') {
                buffer += updatePos(value);
            } else {
                for (var i = 0; i < value.length; i++) {
                    if (typeof value[i] === 'string') {
                        buffer += updatePos(value[i]);
                    } else {
                        buffer = walk(value[i], buffer);
                    }
                }
            }

            leave(node.node, buffer, line, column);

            return buffer;
        }

        if (typeof enter !== 'function') {
            enter = noop;
        }
        if (typeof leave !== 'function') {
            leave = noop;
        }

        var buffer = [];
        var line = 1;
        var column = 0;

        processNode.call({
            children: processChildren,
            node: processNode,
            chunk: function(chunk) {
                buffer.push(chunk);
            }
        }, node);

        return walk(buffer[0], '');
    };
}

function getTypesFromConfig(config) {
    var types = {};

    if (config.node) {
        for (var name in config.node) {
            var nodeType = config.node[name];

            types[name] = nodeType.generate;
        }
    }

    return types;
}

module.exports = function(config) {
    var types = getTypesFromConfig(config);
    var markupGenerator = createMarkupGenerator(types);

    return {
        translate: createGenerator(types),
        translateWithSourceMap: function(node) {
            return sourceMapGenerator(markupGenerator, node);
        },
        translateMarkup: markupGenerator
    };
};

module.exports.createGenerator = createGenerator;
module.exports.createMarkupGenerator = createMarkupGenerator;
module.exports.sourceMap = require('./sourceMap');
