const { Delim, WhiteSpace } = require('../tokenizer/types');
const tokenize = require('../tokenizer');
const isWhiteSpaceRequired = require('./is-whitespace-required');
const sourceMap = require('./sourceMap');
const REVERSESOLIDUS = 0x005c; // U+005C REVERSE SOLIDUS (\)

function processChildren(node, delimeter) {
    if (typeof delimeter === 'function') {
        let prev = null;

        node.children.forEach(node => {
            if (prev !== null) {
                delimeter.call(this, prev);
            }

            this.node(node);
            prev = node;
        });

        return;
    }

    node.children.forEach(this.node, this);
}

function processChunk(chunk) {
    tokenize(chunk, {
        open: (source, lastOffset) => ({
            token: (type, offset) => {
                this.token(type, source.slice(lastOffset, lastOffset = offset));
            },
            close() { }
        })
    });
}

module.exports = function createGenerator(config) {
    const types = new Map();
    for (let name in config.node) {
        types.set(name, config.node[name].generate);
    }

    return function(node, options) {
        let buffer = '';
        let curNode = null;
        let prevCode = 0;
        let handlers = {
            children: processChildren,
            node: function(node) {
                if (types.has(node.type)) {
                    const tmp = curNode;
                    curNode = node;
                    types.get(node.type).call(this, node);
                    curNode = tmp;
                } else {
                    throw new Error('Unknown node type: ' + node.type);
                }
            },
            tokenize: processChunk,
            token(type, value) {
                prevCode = isWhiteSpaceRequired.call(this, prevCode, type, value, curNode);

                this.emit(value, type, curNode);

                if (type === Delim && value.charCodeAt(0) === REVERSESOLIDUS) {
                    this.emit('\n', WhiteSpace, curNode);
                }
            },
            emit(value) {
                buffer += value;
            },
            result() {
                return buffer;
            }
        };

        if (options) {
            if (typeof options.decorator === 'function') {
                handlers = options.decorator(handlers);
            }

            if (options.sourceMap) {
                handlers = sourceMap(handlers);
            }
        }

        handlers.node(node);

        return handlers.result();
    };
};
