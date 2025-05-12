import { getTokenizer } from '../utils/get-tokenizer.js';

const astToTokens = {
    decorator(handlers) {
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
            emit(value, type, auto) {
                tokens.push({
                    type,
                    value,
                    node: auto ? null : curNode
                });
            },
            result() {
                return tokens;
            }
        };
    }
};

function stringToTokens(str, syntax) {
    const tokens = [];
    const tokenize = getTokenizer(syntax);

    tokenize(str, (type, start, end) =>
        tokens.push({
            type,
            value: str.slice(start, end),
            node: null
        })
    );

    return tokens;
}

export default function(value, syntax) {
    if (typeof value === 'string') {
        return stringToTokens(value, syntax);
    }

    return syntax.generate(value, astToTokens);
};
