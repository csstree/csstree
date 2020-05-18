const { WhiteSpace } = require('../../tokenizer/types');

function getOffsetExcludeWS() {
    if (this.tokenIndex > 0) {
        if (this.lookupType(-1) === WhiteSpace) {
            return this.tokenIndex > 1
                ? this.getTokenStart(this.tokenIndex - 1)
                : this.firstCharOffset;
        }
    }

    return this.tokenStart;
}

module.exports = {
    name: 'Raw',
    structure: {
        value: String
    },
    parse: function(startToken, consumeUntil, excludeWhiteSpace) {
        const startOffset = this.getTokenStart(startToken);
        let endOffset;

        this.skipUntilBalanced(startToken, consumeUntil || this.consumeUntilBalanceEnd);

        if (excludeWhiteSpace && this.tokenStart > startOffset) {
            endOffset = getOffsetExcludeWS.call(this);
        } else {
            endOffset = this.tokenStart;
        }

        return {
            type: 'Raw',
            loc: this.getLocation(startOffset, endOffset),
            value: this.substring(startOffset, endOffset)
        };
    },
    generate: function(node) {
        this.tokenize(node.value);
    }
};
