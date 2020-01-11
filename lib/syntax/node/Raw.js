const {
    WhiteSpace,
    Semicolon,
    LeftCurlyBracket,
    Delim
} = require('../../tokenizer/types');

const EXCLAMATIONMARK = 0x0021; // U+0021 EXCLAMATION MARK (!)

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

// 0, 0, false
function balanceEnd() {
    return 0;
}

// LEFTCURLYBRACKET, 0, false
function leftCurlyBracket(tokenType) {
    return tokenType === LeftCurlyBracket ? 1 : 0;
}

// LEFTCURLYBRACKET, SEMICOLON, false
function leftCurlyBracketOrSemicolon(tokenType) {
    return tokenType === LeftCurlyBracket || tokenType === Semicolon ? 1 : 0;
}

// EXCLAMATIONMARK, SEMICOLON, false
function exclamationMarkOrSemicolon(tokenType, source, offset) {
    if (tokenType === Delim && source.charCodeAt(offset) === EXCLAMATIONMARK) {
        return 1;
    }

    return tokenType === Semicolon ? 1 : 0;
}

// 0, SEMICOLON, true
function semicolonIncluded(tokenType) {
    return tokenType === Semicolon ? 2 : 0;
}

module.exports = {
    name: 'Raw',
    structure: {
        value: String
    },
    parse: function(startToken, mode, excludeWhiteSpace) {
        const startOffset = this.getTokenStart(startToken);
        let endOffset;

        this.skip(
            this.getRawLength(startToken, mode || balanceEnd)
        );

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
        this.chunk(node.value);
    },

    mode: {
        default: balanceEnd,
        leftCurlyBracket,
        leftCurlyBracketOrSemicolon,
        exclamationMarkOrSemicolon,
        semicolonIncluded
    }
};
