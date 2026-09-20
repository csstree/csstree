import { BadString, WhiteSpace } from '../../tokenizer/index.js';

const RIGHTCURLYBRACKET = 0x007D; // U+007D RIGHT CURLY BRACKET (})

function getOffsetExcludeWS() {
    if (this.tokenIndex > 0) {
        if (this.lookupType(-1) === WhiteSpace) {
            if (this.tokenIndex > 1 && this.lookupType(-2) === BadString) {
                return this.tokenStart;
            }

            return this.tokenIndex > 1
                ? this.getTokenStart(this.tokenIndex - 1)
                : this.firstCharOffset;
        }
    }

    return this.tokenStart;
}

function getOffsetExcludeBadStringBlockCloser(startOffset, endOffset, startTokenType) {
    if (startTokenType === BadString &&
        this.eof === true &&
        endOffset > startOffset &&
        this.source.charCodeAt(endOffset - 1) === RIGHTCURLYBRACKET) {
        return endOffset - 1;
    }

    return endOffset;
}

export const name = 'Raw';
export const structure = {
    value: String
};

export function parse(consumeUntil, excludeWhiteSpace) {
    const startTokenType = this.tokenType;
    const startOffset = this.getTokenStart(this.tokenIndex);
    let endOffset;

    this.skipUntilBalanced(this.tokenIndex, consumeUntil || this.consumeUntilBalanceEnd);

    if (excludeWhiteSpace && this.tokenStart > startOffset) {
        endOffset = getOffsetExcludeWS.call(this);
    } else {
        endOffset = this.tokenStart;
    }

    endOffset = getOffsetExcludeBadStringBlockCloser.call(this, startOffset, endOffset, startTokenType);

    return {
        type: 'Raw',
        loc: this.getLocation(startOffset, endOffset),
        value: this.substring(startOffset, endOffset)
    };
}

export function generate(node) {
    this.tokenize(node.value);
}
