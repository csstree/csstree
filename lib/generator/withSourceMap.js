'use strict';

var Generator = require('./Generator');
var SourceMapGenerator = require('source-map').SourceMapGenerator;

function generateSourceMap(root, trackNodes) {
    function updatePos(buffer) {
        for (; bufferPos < buffer.length; bufferPos++) {
            if (buffer.charCodeAt(bufferPos) === 10) { // \n
                generated.line++;
                generated.column = 0;
            } else {
                generated.column++;
            }
        }
    }

    var map = new SourceMapGenerator();
    var sourceMappingActive = false;
    var bufferPos = 0;
    var generated = {
        line: 1,
        column: 0
    };
    var original = {
        line: 0,
        column: 0
    };
    var activatedMapping = {
        generated: generated
    };

    var css = render(root, function(node, buffer) {
        if (!node.loc ||
            !node.loc.start ||
            !trackNodes.hasOwnProperty(node.type)) {
            return;
        }

        var line = node.loc.start.line;
        var column = node.loc.start.column - 1;

        if (original.line !== line ||
            original.column !== column) {
            original.line = line;
            original.column = column;
            updatePos(buffer);

            sourceMappingActive = true;
            map.addMapping({
                source: node.loc.source,
                original: original,
                generated: generated
            });
        }

    }, function(node, buffer) {
        if (sourceMappingActive && trackNodes.hasOwnProperty(node.type)) {
            updatePos(buffer);
            sourceMappingActive = false;
            map.addMapping(activatedMapping);
        }
    });

    return {
        css: css,
        map: map
    };
}

var generator = new Generator();

generator.generate = function(node, item, list) {
    if (this.type.hasOwnProperty(node.type)) {
        return {
            node: node,
            value: this.type[node.type].call(this, node, item, list)
        };
    } else {
        throw new Error('Unknown node type: ' + node.type);
    }
};

function render(node, before, after) {
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

    return walk(node, '');
}

module.exports = function(node) {
    return generateSourceMap(
        generator.generate(node), {
            Atrule: true,
            Selector: true,
            Declaration: true
        }
    );
};
