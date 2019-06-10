var tokenize = require('../tokenizer');
var TokenStream = require('../common/TokenStream');
var tokenStream = new TokenStream();

module.exports = {
    decorator: function(handlers) {
        var curNode = null;
        var prev = { len: 0, node: null };
        var nodes = [prev];
        var tokens = [];
        var buffer = '';

        return {
            children: handlers.children,
            node: function(node) {
                var tmp = curNode;
                curNode = node;
                handlers.node.call(this, node);
                curNode = tmp;
            },
            chunk: function(chunk) {
                buffer += chunk;
                if (prev.node !== curNode) {
                    nodes.push({
                        len: chunk.length,
                        node: curNode
                    });
                } else {
                    prev.len += chunk.length;
                }
            },
            result: function() {
                var nodesOffset = 0;
                var nodesIndex = 0;

                tokenize(buffer, tokenStream);

                while (!tokenStream.eof) {
                    while (nodesIndex < nodes.length && nodesOffset + nodes[nodesIndex].len <= tokenStream.tokenStart) {
                        nodesOffset += nodes[nodesIndex++].len;
                    }

                    tokens.push({
                        type: tokenStream.tokenType,
                        value: tokenStream.getTokenValue(),
                        index: tokenStream.tokenIndex, // TODO: remove it, temporary solution
                        balance: tokenStream.balance[tokenStream.tokenIndex], // TODO: remove it, temporary solution
                        node: nodes[nodesIndex].node   // TODO: should be optional
                    });
                    tokenStream.next();
                    // console.log({ ...tokens[tokens.length - 1], node: undefined });
                }

                return tokens;
            }
        };
    }
};
