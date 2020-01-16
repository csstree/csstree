const tokenize = require('../tokenizer');
const astToTokens = {
    decorator: function(handlers) {
        const tokens = [];

        return {
            ...handlers,
            emit(value, type, node) {
                tokens.push({
                    type,
                    value,
                    node
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
