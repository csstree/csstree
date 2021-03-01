var SourceMapGenerator = require('../../../x-source-map/lib/generator');
var trackNodes = {
    Atrule: true,
    Selector: true,
    Declaration: true
};

module.exports = function generateSourceMap(handlers) {
    console.log('new');
    var map = new SourceMapGenerator();
    var line = 1;
    var column = 0;
    var generatedLine = 1;
    var generatedColumn = 0;
    var originalLine = 0; // should be zero to add first mapping
    var originalColumn = 0;
    var sourceMappingActive = false;
    var activatedGeneratedLine = 1;
    var activatedGeneratedColumn = 0;

    var handlersNode = handlers.node;
    handlers.node = function(node) {
        if (node.loc && node.loc.start && trackNodes.hasOwnProperty(node.type)) {
            var nodeLine = node.loc.start.line;
            var nodeColumn = node.loc.start.column - 1;

            if (originalLine !== nodeLine ||
                originalColumn !== nodeColumn) {
                originalLine = nodeLine;
                originalColumn = nodeColumn;

                if (sourceMappingActive) {
                    sourceMappingActive = false;
                    if (generatedLine !== activatedGeneratedLine ||
                        generatedColumn !== activatedGeneratedColumn) {
                        map.addMapping(
                            activatedGeneratedLine,
                            activatedGeneratedColumn
                        );
                    }
                }

                sourceMappingActive = true;
                map.addMapping(
                    generatedLine,
                    generatedColumn,
                    node.loc.source,
                    originalLine,
                    originalColumn
                );
            }
        }

        handlersNode.call(this, node);

        if (sourceMappingActive && trackNodes.hasOwnProperty(node.type)) {
            activatedGeneratedLine = generatedLine;
            activatedGeneratedColumn = generatedColumn;
        }
    };

    var handlersChunk = handlers.chunk;
    handlers.chunk = function(chunk) {
        for (var i = 0; i < chunk.length; i++) {
            if (chunk.charCodeAt(i) === 10) { // \n
                generatedLine++;
                generatedColumn = 0;
            } else {
                generatedColumn++;
            }
        }

        handlersChunk(chunk);
    };

    var handlersResult = handlers.result;
    handlers.result = function() {
        if (sourceMappingActive) {
            map.addMapping(
                activatedGeneratedLine,
                activatedGeneratedColumn
            );
        }

        return {
            css: handlersResult(),
            map: map
        };
    };

    return handlers;
};
