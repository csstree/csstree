const tokenize = require('../tokenizer');
const TokenStream = require('../common/TokenStream');
const tokenStream = new TokenStream();
const astToTokens = {
    decorator: function(handlers) {
        const nodes = [{ len: 0, node: null }];
        let curNode = null;
        let buffer = '';

        return {
            children: handlers.children,
            node: function(node) {
                const tmp = curNode;
                curNode = node;
                handlers.node.call(this, node);
                curNode = tmp;
            },
            chunk: function(chunk) {
                buffer += chunk;
                nodes.push({
                    len: chunk.length,
                    node: curNode
                });
            },
            result: function() {
                return prepareTokens(buffer, nodes);
            }
        };
    }
};

function prepareTokens(str, nodes) {
    const tokens = [];
    let nodesOffset = 0;
    let nodesIndex = 0;
    let currentNode = null;

    tokenize(str, tokenStream);

    while (!tokenStream.eof) {
        if (nodes) {
            while (nodesIndex < nodes.length && nodesOffset + nodes[nodesIndex].len <= tokenStream.tokenStart) {
                nodesOffset += nodes[nodesIndex++].len;
                currentNode = nodes[nodesIndex].node;
            }
        }

        tokens.push({
            type: tokenStream.tokenType,
            value: tokenStream.getTokenValue(),
            index: tokenStream.tokenIndex, // TODO: remove it, temporary solution
            balance: tokenStream.balance[tokenStream.tokenIndex], // TODO: remove it, temporary solution
            node: currentNode
        });
        tokenStream.next();
        // console.log({ ...tokens[tokens.length - 1], node: undefined });
    }

    return tokens;
}

module.exports = function(value, syntax) {
    if (typeof value === 'string') {
        return prepareTokens(value, null);
    }

    return syntax.generate(value, astToTokens);
};
