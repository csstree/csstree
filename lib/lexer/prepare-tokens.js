const tokenize = require('../tokenizer');
const astToTokens = {
    decorator: function(handlers) {
        const tokens = [];
        let curNode = null;

        return {
            ...handlers,
            node(node) {
                const tmp = curNode;
                curNode = node;
                handlers.node.call(this, node);
                curNode = tmp;
            },
            emit(value, type) {
                tokens.push({
                    type,
                    value,
                    node: curNode
                });
            },
            result() {
                return tokens;
            }
        };
    }
};

function stringToTokens(str) {
    const tokens = [];

    tokenize(str, {
        open(source, startOffset) {
            return {
                token(type, offset) {
                    tokens.push({
                        type,
                        value: source.slice(startOffset, startOffset = offset),
                        node: null
                    });
                },
                close() {}
            };
        }
    });

    return tokens;
}

module.exports = function(value, syntax) {
    if (typeof value === 'string') {
        return stringToTokens(value);
    }

    return syntax.generate(value, astToTokens);
};
