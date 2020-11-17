const { Delim, WhiteSpace } = require('../tokenizer/types');
const tokenize = require('../tokenizer');
const tokenBefore = require('./token-before');
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
    tokenize(chunk, (type, start, end) => {
        this.token(type, chunk.slice(start, end));
    });
}

module.exports = function createGenerator(config) {
    const types = new Map();
    for (let name in config.node) {
        types.set(name, config.node[name].generate);
    }

    return function(node, options) {
        let buffer = '';
        let prevCode = 0;
        let handlers = {
            children: processChildren,
            node: function(node) {
                if (types.has(node.type)) {
                    types.get(node.type).call(this, node);
                } else {
                    throw new Error('Unknown node type: ' + node.type);
                }
            },
            tokenize: processChunk,
            tokenBefore: tokenBefore.safe,
            token(type, value) {
                prevCode = this.tokenBefore(prevCode, type, value);

                this.emit(value, type, false);

                if (type === Delim && value.charCodeAt(0) === REVERSESOLIDUS) {
                    this.emit('\n', WhiteSpace, true);
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

            if (tokenBefore.hasOwnProperty(options.mode)) {
                handlers.tokenBefore = tokenBefore[options.mode];
            }
        }

        handlers.node(node);

        return handlers.result();
    };
};
