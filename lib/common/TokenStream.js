const { cmpStr } = require('../tokenizer/utils');
const { NAME, TYPE: { WhiteSpace, Comment, Delim, EOF } } = require('../tokenizer/const');
const OFFSET_MASK = 0x00FFFFFF;
const TYPE_SHIFT = 24;

module.exports = class TokenStream {
    constructor() {
        this.offsetAndType = null;
        this.balance = null;

        this.reset();
    }
    reset() {
        this.eof = false;
        this.tokenIndex = -1;
        this.tokenType = 0;
        this.tokenStart = this.firstCharOffset;
        this.tokenEnd = this.firstCharOffset;
    }

    lookupType(offset) {
        offset += this.tokenIndex;

        if (offset < this.tokenCount) {
            return this.offsetAndType[offset] >> TYPE_SHIFT;
        }

        return EOF;
    }
    lookupOffset(offset) {
        offset += this.tokenIndex;

        if (offset < this.tokenCount) {
            return this.offsetAndType[offset - 1] & OFFSET_MASK;
        }

        return this.source.length;
    }
    lookupValue(offset, referenceStr) {
        offset += this.tokenIndex;

        if (offset < this.tokenCount) {
            return cmpStr(
                this.source,
                this.offsetAndType[offset - 1] & OFFSET_MASK,
                this.offsetAndType[offset] & OFFSET_MASK,
                referenceStr
            );
        }

        return false;
    }
    getTokenStart(tokenIndex) {
        if (tokenIndex === this.tokenIndex) {
            return this.tokenStart;
        }

        if (tokenIndex > 0) {
            return tokenIndex < this.tokenCount
                ? this.offsetAndType[tokenIndex - 1] & OFFSET_MASK
                : this.offsetAndType[this.tokenCount] & OFFSET_MASK;
        }

        return this.firstCharOffset;
    }

    // TODO: -> skipUntilBalanced
    getRawLength(startToken, mode) {
        let cursor = startToken;
        let balanceEnd;
        let offset = this.offsetAndType[Math.max(cursor - 1, 0)] & OFFSET_MASK;
        let type;

        loop:
        for (; cursor < this.tokenCount; cursor++) {
            balanceEnd = this.balance[cursor];

            // stop scanning on balance edge that points to offset before start token
            if (balanceEnd < startToken) {
                break loop;
            }

            type = this.offsetAndType[cursor] >> TYPE_SHIFT;

            // check token is stop type
            switch (mode(type, this.source, offset)) {
                case 1:
                    break loop;

                case 2:
                    cursor++;
                    break loop;

                default:
                    offset = this.offsetAndType[cursor] & OFFSET_MASK;

                    // fast forward to the end of balanced block
                    if (this.balance[balanceEnd] === cursor) {
                        cursor = balanceEnd;
                    }
            }
        }

        return cursor - this.tokenIndex;
    }
    isBalanceEdge(pos) {
        return this.balance[this.tokenIndex] < pos;
    }
    isDelim(code, offset) {
        if (offset) {
            return (
                this.lookupType(offset) === Delim &&
                this.source.charCodeAt(this.lookupOffset(offset)) === code
            );
        }

        return (
            this.tokenType === Delim &&
            this.source.charCodeAt(this.tokenStart) === code
        );
    }

    getTokenValue() {
        return this.source.substring(this.tokenStart, this.tokenEnd);
    }
    getTokenLength() {
        return this.tokenEnd - this.tokenStart;
    }
    substrToCursor(start) {
        return this.source.substring(start, this.tokenStart);
    }

    skipWS() {
        let skipTokenCount = 0;

        for (let i = this.tokenIndex; i < this.tokenCount; i++, skipTokenCount++) {
            if ((this.offsetAndType[i] >> TYPE_SHIFT) !== WhiteSpace) {
                break;
            }
        }

        if (skipTokenCount > 0) {
            this.skip(skipTokenCount);
        }
    }
    skipSC() {
        while (this.tokenType === WhiteSpace || this.tokenType === Comment) {
            this.next();
        }
    }
    skip(tokenCount) {
        let next = this.tokenIndex + tokenCount;

        if (next < this.tokenCount) {
            this.tokenIndex = next;
            this.tokenStart = this.offsetAndType[next - 1] & OFFSET_MASK;
            next = this.offsetAndType[next];
            this.tokenType = next >> TYPE_SHIFT;
            this.tokenEnd = next & OFFSET_MASK;
        } else {
            this.tokenIndex = this.tokenCount;
            this.next();
        }
    }
    next() {
        let next = this.tokenIndex + 1;

        if (next < this.tokenCount) {
            this.tokenIndex = next;
            this.tokenStart = this.tokenEnd;
            next = this.offsetAndType[next];
            this.tokenType = next >> TYPE_SHIFT;
            this.tokenEnd = next & OFFSET_MASK;
        } else {
            this.tokenIndex = this.tokenCount;
            this.eof = true;
            this.tokenType = EOF;
            this.tokenStart = this.tokenEnd = this.source.length;
        }
    }

    dump() {
        let offset = this.firstCharOffset;

        return Array.prototype.slice.call(this.offsetAndType, 0, this.tokenCount).map(function(item, idx) {
            const start = offset;
            const end = item & OFFSET_MASK;

            offset = end;

            return {
                idx: idx,
                type: NAME[item >> TYPE_SHIFT],
                chunk: this.source.substring(start, end),
                balance: this.balance[idx]
            };
        }, this);
    }
};
