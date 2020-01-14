const sourceMap = require('./sourceMap');
const tokenize = require('../tokenizer');

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

module.exports = function createGenerator(config) {
    function processNode(node) {
        if (types.has(node.type)) {
            types.get(node.type).call(this, node);
        } else {
            throw new Error('Unknown node type: ' + node.type);
        }
    }

    const types = new Map();
    for (let name in config.node) {
        types.set(name, config.node[name].generate);
    }

    return function(node, options) {
        let buffer = '';
        let handlers = {
            children: processChildren,
            node: processNode,
            tokenize(chunk) {
                tokenize(chunk, {
                    open: (source, lastOffset) => ({
                        token: (type, offset) => {
                            this.token(type, source.slice(lastOffset, lastOffset = offset));
                        },
                        close() { }
                    })
                });
            },
            token(_, value) {
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
