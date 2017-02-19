'use strict';

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

function each(list) {
    if (list.head === null) {
        return '';
    }

    if (list.head === list.tail) {
        return translate(list.head.data);
    }

    return list.map(translate).join('');
}

function translateBlock(list) {
    var cursor = list.head;
    var result = [];

    while (cursor !== null) {
        result.push(translate(cursor.data));
        if (cursor.next && cursor.data.type === 'Declaration') {
            result.push(';');
        }
        cursor = cursor.next;
    }

    return result;
}

function translate(node) {
    switch (node.type) {
        case 'StyleSheet':
            return createAnonymousSourceNode(node.children.map(translate));

        case 'Atrule':
            var nodes = ['@', node.name];

            if (node.expression !== null) {
                nodes.push(' ', translate(node.expression));
            }

            if (node.block) {
                nodes.push(translate(node.block));
            } else {
                nodes.push(';');
            }

            return createSourceNode(node.loc, nodes);

        case 'Rule':
            return createAnonymousSourceNode([
                translate(node.selector), translate(node.block)
            ]);

        case 'SelectorList':
            return createAnonymousSourceNode(node.children.map(translate)).join(',');

        case 'Selector':
            return createSourceNode(node.loc, node.children.map(translate));

        case 'Block':
            return createAnonymousSourceNode([
                '{', translateBlock(node.children), '}'
            ]);

        case 'DeclarationList':
            return translateBlock(node.children);

        case 'Declaration':
            return createSourceNode(
                node.loc,
                node.important
                    ? [node.property, ':', translate(node.value), '!important']
                    : [node.property, ':', translate(node.value)]
            );

        case 'Value':
            return each(node.children);

        case 'Nth':
            var nodes = [translate(node.nth)];

            if (node.selector !== null) {
                nodes.push(' of ', translate(node.selector));
            }

            return createAnonymousSourceNode(nodes);

        case 'AttributeSelector':
            var result = translate(node.name);
            var flagsPrefix = ' ';

            if (node.operator !== null) {
                result += node.operator;

                if (node.value !== null) {
                    result += translate(node.value);

                    // space between string and flags is not required
                    if (node.value.type === 'String') {
                        flagsPrefix = '';
                    }
                }
            }

            if (node.flags !== null) {
                result += flagsPrefix + node.flags;
            }

            return '[' + result + ']';

        case 'Function':
            return node.name + '(' + each(node.children) + ')';

        case 'Parentheses':
            return '(' + each(node.children) + ')';

        case 'Brackets':
            return '[' + each(node.children) + ']';

        case 'AtruleExpression':
            return each(node.children);

        case 'MediaQueryList':
            return createAnonymousSourceNode(node.children.map(translate)).join(',');

        case 'MediaQuery':
            return each(node.children);

        case 'MediaFeature':
            return node.value !== null
                ? '(' + node.name + ':' + translate(node.value) + ')'
                : '(' + node.name + ')';

        case 'Url':
            return 'url(' + translate(node.value) + ')';

        case 'Combinator':
            return node.name;

        case 'TypeSelector':
            return node.name;

        case 'Identifier':
            return node.name;

        case 'PseudoClassSelector':
            return node.children !== null
                ? ':' + node.name + '(' + each(node.children) + ')'
                : ':' + node.name;

        case 'PseudoElementSelector':
            return node.children !== null
                ? '::' + node.name + '(' + each(node.children) + ')'
                : '::' + node.name;

        case 'ClassSelector':
            return '.' + node.name;

        case 'IdSelector':
            return '#' + node.name;

        case 'UnicodeRange':
            return node.value;

        case 'HexColor':
            return '#' + node.value;

        case 'Dimension':
            return node.value + node.unit;

        case 'AnPlusB':
            var result = '';
            var a = node.a !== null && node.a !== undefined;
            var b = node.b !== null && node.b !== undefined;

            if (a) {
                result += node.a === '+1' || node.a === '1' ? 'n' :
                          node.a === '-1' ? '-n' :
                          node.a + 'n';
            }

            if (a && b) {
                if (String(node.b).charAt(0) !== '-' &&
                    String(node.b).charAt(0) !== '+') {
                    result += '+';
                }
            }

            if (b) {
                result += node.b;
            }

            return result;

        case 'Number':
            return node.value;

        case 'String':
            return node.value;

        case 'Operator':
            return node.value;

        case 'Ratio':
            return node.left + '/' + node.right;

        case 'Raw':
            return node.value;

        case 'Percentage':
            return node.value + '%';

        case 'WhiteSpace':
            return node.value;

        case 'Comment':
            return '/*' + node.value + '*/';

        default:
            throw new Error('Unknown node type: ' + node.type);
    }
}

module.exports = function(node) {
    return generateSourceMap(
        createAnonymousSourceNode(translate(node))
    );
};
