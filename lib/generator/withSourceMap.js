'use strict';

var Generator = require('./Generator');
var SourceMapGenerator = require('source-map').SourceMapGenerator;
var SourceNode = require('source-map').SourceNode;

// Our own implementation of SourceNode#toStringWithSourceMap,
// since SourceNode doesn't allow multiple references to original source.
// Also, as we know structure of result we could be optimize generation
// (currently it's ~40% faster).
function walk(node, fn) {
    for (var chunk, i = 0; i < node.children.length; i++) {
        chunk = node.children[i];

        if (chunk instanceof SourceNode) {
            walk(chunk, fn);
        } else {
            fn(chunk, node);
        }
    }
}

function generateSourceMap(root) {
    var map = new SourceMapGenerator();
    var css = '';
    var sourceMappingActive = false;
    var lastOriginalLine = null;
    var lastOriginalColumn = null;
    var lastIndexOfNewline;
    var generated = {
        line: 1,
        column: 0
    };
    var activatedMapping = {
        generated: generated
    };

    walk(root, function(chunk, original) {
        if (original.line !== null && original.column !== null) {
            if (lastOriginalLine !== original.line ||
                lastOriginalColumn !== original.column) {
                map.addMapping({
                    source: original.source,
                    original: original,
                    generated: generated
                });
            }

            lastOriginalLine = original.line;
            lastOriginalColumn = original.column;
            sourceMappingActive = true;
        } else if (sourceMappingActive) {
            map.addMapping(activatedMapping);
            sourceMappingActive = false;
        }

        css += chunk;
        lastIndexOfNewline = chunk.lastIndexOf('\n');

        if (lastIndexOfNewline !== -1) {
            generated.line += chunk.match(/\n/g).length;
            generated.column = chunk.length - lastIndexOfNewline - 1;
        } else {
            generated.column += chunk.length;
        }
    });

    return {
        css: css,
        map: map
    };
}

function createAnonymousSourceNode(children) {
    return new SourceNode(
        null,
        null,
        null,
        children
    );
}

function createSourceNode(loc, children) {
    return new SourceNode(
        loc.start ? loc.start.line : null,
        loc.start ? loc.start.column - 1 : null,
        loc.source,
        children
    );
}

function assign(dest, src) {
    for (var key in src) {
        dest[key] = src[key];
    }

    return dest;
}

var generator = new Generator();

generator.type = assign(assign({}, generator.type), {
    StyleSheet: function(node) {
        return createAnonymousSourceNode(
            node.children.map(this.generate, this)
        );
    },
    Atrule: function(node) {
        var nodes = ['@', node.name];

        if (node.expression !== null) {
            nodes.push(' ', this.generate(node.expression));
        }

        if (node.block) {
            nodes.push(this.generate(node.block));
        } else {
            nodes.push(';');
        }

        return createSourceNode(
            node.loc,
            nodes
        );
    },
    Rule: function(node) {
        return createAnonymousSourceNode([
            this.generate(node.selector),
            this.generate(node.block)
        ]);
    },
    SelectorList: function(node) {
        return createAnonymousSourceNode(
            node.children.map(this.generate, this)
        ).join(',');
    },
    Selector: function(node) {
        return createSourceNode(
            node.loc,
            node.children.map(this.generate, this)
        );
    },
    Block: function(node) {
        return createAnonymousSourceNode([
            '{', this.each(node.children), '}'
        ]);
    },
    Declaration: function(node, item) {
        return createSourceNode(
            node.loc,
            [node.property, ':', this.generate(node.value),
                node.important ? '!important' : '',
                item && item.next ? ';' : ''
            ]
        );
    }
});

module.exports = function(node) {
    return generateSourceMap(
        createAnonymousSourceNode(generator.generate(node))
    );
};
