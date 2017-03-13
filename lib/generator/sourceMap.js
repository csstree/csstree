'use strict';

var SourceMapGenerator = require('source-map').SourceMapGenerator;
var trackNodes = {
    Atrule: true,
    Selector: true,
    Declaration: true
};

module.exports = function generateSourceMap(generator, ast) {
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

    var css = generator(ast, function(node, buffer) {
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
};
