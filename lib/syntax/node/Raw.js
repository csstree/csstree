import {
    WhiteSpace,
    Function as FunctionToken,
    LeftParenthesis,
    LeftSquareBracket,
    LeftCurlyBracket
} from '../../tokenizer/index.js';

const blockCloseChars = {
    [FunctionToken]: ')',
    [LeftParenthesis]: ')',
    [LeftSquareBracket]: ']',
    [LeftCurlyBracket]: '}'
};

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

export const name = 'Raw';
export const structure = {
    value: String
};

export function parse(consumeUntil, excludeWhiteSpace) {
    const startOffset = this.getTokenStart(this.tokenIndex);
    const startIndex = this.tokenIndex;
    let endOffset;

    this.skipUntilBalanced(startIndex, consumeUntil || this.consumeUntilBalanceEnd);

    if (excludeWhiteSpace && this.tokenStart > startOffset) {
        endOffset = getOffsetExcludeWS.call(this);
    } else {
        endOffset = this.tokenStart;
    }

    let value = this.substring(startOffset, endOffset);

    // Per CSS Syntax Module Level 3, EOF closes any simple block that is still open.
    // When a raw inside a block consumes the rest of the input, block openers left
    // unclosed in it would capture the closing braces that generate() emits for the
    // enclosing blocks on a re-parse, so the output would not be stable. Append the
    // implicit closing tokens for such openers (innermost first)
    if (this.blockDepth > 0 && this.eof) {
        let closeChars = '';

        for (let i = this.tokenIndex - 1; i >= startIndex; i--) {
            const tokenType = this.getTokenType(i);

            if (this.isBlockOpenerTokenType(tokenType) && this.balance[i] >= this.tokenCount) {
                closeChars += blockCloseChars[tokenType];
            }
        }

        if (closeChars !== '') {
            value += closeChars;
        }
    }

    return {
        type: 'Raw',
        loc: this.getLocation(startOffset, endOffset),
        value
    };
}

export function generate(node) {
    this.tokenize(node.value);
}
