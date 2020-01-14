const adoptBuffer = require('../common/adopt-buffer');
const { cmpStr } = require('../tokenizer/utils');
const NAME = require('../tokenizer/names');
const {
    WhiteSpace,
    Comment,
    Delim,
    EOF,
    Function: FunctionToken,
    LeftParenthesis,
    RightParenthesis,
    LeftSquareBracket,
    RightSquareBracket,
    LeftCurlyBracket,
    RightCurlyBracket
} = require('../tokenizer/types');

const OFFSET_MASK = 0x00FFFFFF;
const TYPE_SHIFT = 24;
const balancePair = new Map([
    [FunctionToken, RightParenthesis],
    [LeftParenthesis, RightParenthesis],
    [LeftSquareBracket, RightSquareBracket],
    [LeftCurlyBracket, RightCurlyBracket]
]);

module.exports = class TokenStream {
    constructor() {
        this.open('', 0).close();
    }
    reset() {
        this.eof = false;
        this.tokenIndex = -1;
        this.tokenType = 0;
        this.tokenStart = this.firstCharOffset;
        this.tokenEnd = this.firstCharOffset;
    }
    open(source, firstCharOffset) {
        const sourceLength = source.length;
        const offsetAndType = adoptBuffer(this.offsetAndType, source.length + 1); // +1 because of eof-token
        const balance = adoptBuffer(this.balance, source.length + 1);
        let tokenCount = 0;
        let balanceCloseType = 0;
        let balanceStart = 0;

        // capture buffers
        this.offsetAndType = null;
        this.balance = null;

        return {
            token(type, offset) {
                switch (type) {
                    default:
                        balance[tokenCount] = sourceLength;
                        break;

                    case balanceCloseType: {
                        let balancePrev = balanceStart & OFFSET_MASK;
                        balanceStart = balance[balancePrev];
                        balanceCloseType = balanceStart >> TYPE_SHIFT;
                        balance[tokenCount] = balancePrev;
                        balance[balancePrev++] = tokenCount;
                        for (; balancePrev < tokenCount; balancePrev++) {
                            if (balance[balancePrev] === sourceLength) {
                                balance[balancePrev] = tokenCount;
                            }
                        }
                        break;
                    }

                    case LeftParenthesis:
                    case FunctionToken:
                    case LeftSquareBracket:
                    case LeftCurlyBracket:
                        balance[tokenCount] = balanceStart;
                        balanceCloseType = balancePair.get(type);
                        balanceStart = (balanceCloseType << TYPE_SHIFT) | tokenCount;
                        break;
                }

                offsetAndType[tokenCount++] = (type << TYPE_SHIFT) | offset;
            },
            close: () => {
                // finalize buffers
                offsetAndType[tokenCount] = (EOF << TYPE_SHIFT) | sourceLength; // <EOF-token>
                balance[tokenCount] = sourceLength;
                balance[sourceLength] = sourceLength; // prevents false positive balance match with any token
                while (balanceStart !== 0) {
                    const balancePrev = balanceStart & OFFSET_MASK;
                    balanceStart = balance[balancePrev];
                    balance[balancePrev] = sourceLength;
                }

                this.source = source;
                this.firstCharOffset = firstCharOffset;
                this.tokenCount = tokenCount;
                this.offsetAndType = offsetAndType;
                this.balance = balance;

                this.reset();
                this.next();
            }
        };
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
    getRawLength(startToken, stopConsume) {
        let cursor = startToken;
        let balanceEnd;
        let offset;

        loop:
        for (; cursor < this.tokenCount; cursor++) {
            balanceEnd = this.balance[cursor];

            // stop scanning on balance edge that points to offset before start token
            if (balanceEnd < startToken) {
                break loop;
            }

            offset = cursor > 0 ? this.offsetAndType[cursor - 1] & OFFSET_MASK : this.firstCharOffset;

            // check stop condition
            switch (stopConsume(this.source.charCodeAt(offset))) {
                case 1: // just stop
                    break loop;

                case 2: // stop & included
                    cursor++;
                    break loop;

                default:
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
            this.eof = true;
            this.tokenIndex = this.tokenCount;
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
                idx,
                type: NAME[item >> TYPE_SHIFT],
                chunk: this.source.substring(start, end),
                balance: this.balance[idx]
            };
        }, this);
    }
};
