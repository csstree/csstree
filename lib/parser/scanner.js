'use strict';

var CssSyntaxError = require('./error');
var TokenType = require('./const').TokenType;
var TokenName = require('./const').TokenName;
var IS_PUNCTUATION = require('./const').IS_PUNCTUATION;
var SYMBOL_CATEGORY = require('./const').SYMBOL_CATEGORY;
var SYMBOL_CATEGORY_LENGTH = SYMBOL_CATEGORY.length;
var cmpStr = require('./utils').cmpStr;
var isHex = require('./utils').isHex;

var NULL = 0;
var WHITESPACE = TokenType.Whitespace;
var IDENTIFIER = TokenType.Identifier;
var NUMBER = TokenType.Number;
var STRING = TokenType.String;
var COMMENT = TokenType.Comment;
var PUNCTUATION = TokenType.Punctuation;

var TAB = 9;
var N = 10;
var F = 12;
var R = 13;
var SPACE = 32;
var STAR = 42;
var SLASH = 47;
var BACK_SLASH = 92;
var FULLSTOP = TokenType.FullStop;
var PLUSSIGN = TokenType.PlusSign;
var HYPHENMINUS = TokenType.HyphenMinus;
var E = 101; // 'e'.charCodeAt(0)

var MIN_BUFFER_SIZE = 16 * 1024;
var OFFSET_MASK = 0x00FFFFFF;
var TYPE_OFFSET = 24;
var SafeUint32Array = typeof Uint32Array !== 'undefined' ? Uint32Array : Array; // fallback on Array when TypedArray is not supported
var lastIndexOf = Array.prototype.lastIndexOf; // some browser implementations have no TypedArray#lastIndexOf

var offsetAndType = new SafeUint32Array(MIN_BUFFER_SIZE);
var lines = null;

function firstCharOffset(source) {
    return source.charCodeAt(0) === 0xFEFF ? 1 : 0;
}

function isNumber(code) {
    return code >= 48 && code <= 57;
}

function computeLines(scanner, source) {
    var sourceLength = source.length;
    var start = firstCharOffset(source);
    var line = scanner.initLine;

    if (lines === null || lines.length < sourceLength + 1) {
        lines = new SafeUint32Array(Math.max(sourceLength + 1024, MIN_BUFFER_SIZE));
    }

    for (var i = start; i < sourceLength; i++) {
        var code = source.charCodeAt(i);

        lines[i] = line;

        if (code === N || code === R || code === F) {
            if (code === R && i + 1 < sourceLength && source.charCodeAt(i + 1) === N) {
                i++;
                lines[i] = line;
            }
            line++;
        }
    }

    lines[i] = line;

    return lines;
}

function findLastNonSpaceLocation(scanner) {
    for (var i = scanner.source.length - 1; i >= 0; i--) {
        var code = scanner.source.charCodeAt(i);

        if (code !== SPACE && code !== TAB && code !== R && code !== N && code !== F) {
            break;
        }
    }

    return scanner.getLocation(i + 1);
};

function isNewline(source, offset, code) {
    if (code === N || code === F || code === R) {
        if (code === R && offset + 1 < source.length && source.charCodeAt(offset + 1) === N) {
            return 2;
        }

        return 1;
    }

    return 0;
}

function findWhitespaceEnd(source, offset) {
    for (; offset < source.length; offset++) {
        var code = source.charCodeAt(offset);

        if (code !== SPACE && code !== TAB && code !== R && code !== N && code !== F) {
            break;
        }
    }

    return offset;
}

function findCommentEnd(source, offset) {
    var commentEnd = source.indexOf('*/', offset);

    if (commentEnd === -1) {
        return source.length;
    }

    return commentEnd + 2;
}

function findStringEnd(source, offset, quote) {
    for (; offset < source.length; offset++) {
        var code = source.charCodeAt(offset);

        // TODO: bad string
        if (code === BACK_SLASH) {
            offset++;
        } else if (code === quote) {
            offset++;
            break;
        }
    }

    return offset;
}

function findDecimalNumberEnd(source, offset) {
    for (; offset < source.length; offset++) {
        var code = source.charCodeAt(offset);

        if (code < 48 || code > 57) {  // not a 0 .. 9
            break;
        }
    }

    return offset;
}

function findNumberEnd(source, offset, allowFraction) {
    var code;

    offset = findDecimalNumberEnd(source, offset);

    // fraction: .\d+
    if (allowFraction && offset + 1 < source.length && source.charCodeAt(offset) === FULLSTOP) {
        code = source.charCodeAt(offset + 1);

        if (isNumber(code)) {
            offset = findDecimalNumberEnd(source, offset + 1);
        }
    }

    // exponent: e[+-]\d+
    if (offset + 1 < source.length) {
        if ((source.charCodeAt(offset) | 32) === E) { // case insensitive check for `e`
            code = source.charCodeAt(offset + 1);

            if (code === PLUSSIGN || code === HYPHENMINUS) {
                if (offset + 2 < source.length) {
                    code = source.charCodeAt(offset + 2);
                }
            }

            if (isNumber(code)) {
                offset = findDecimalNumberEnd(source, offset + 2);
            }
        }
    }

    return offset;
}

// skip escaped unicode sequence that can ends with space
// [0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?
function findEscaseEnd(source, offset) {
    for (var i = 0; i < 7 && offset + i < source.length; i++) {
        var code = source.charCodeAt(offset + i);

        if (i !== 6 && isHex(code)) {
            continue;
        }

        if (i > 0) {
            offset += i - 1 + isNewline(source, offset + i, code);
            if (code === SPACE || code === TAB) {
                offset++;
            }
        }

        break;
    }

    return offset;
}

function findIdentifierEnd(source, offset) {
    for (; offset < source.length; offset++) {
        var code = source.charCodeAt(offset);

        if (code === BACK_SLASH) {
            offset = findEscaseEnd(source, offset + 1);
        } else if (code < SYMBOL_CATEGORY_LENGTH && IS_PUNCTUATION[code] === PUNCTUATION) {
            break;
        }
    }

    return offset;
}

function tokenLayout(scanner, source, startPos) {
    var sourceLength = source.length;
    var tokenCount = 0;
    var prevType = 0;
    var offset = startPos;

    if (offsetAndType.length < sourceLength + 1) {
        offsetAndType = new SafeUint32Array(sourceLength + 1024);
    }

    while (offset < sourceLength) {
        var code = source.charCodeAt(offset);
        var type = code < SYMBOL_CATEGORY_LENGTH ? SYMBOL_CATEGORY[code] : IDENTIFIER;

        switch (type) {
            case WHITESPACE:
                offset = findWhitespaceEnd(source, offset + 1);
                break;

            case PUNCTUATION:
                if (code === STAR && prevType === SLASH) { // /*
                    type = COMMENT;
                    offset = findCommentEnd(source, offset + 1);
                    tokenCount--; // rewrite prev token
                } else {
                    // edge case for -.123 and +.123
                    if (code === FULLSTOP && (prevType === PLUSSIGN || prevType === HYPHENMINUS)) {
                        if (offset + 1 < sourceLength && isNumber(source.charCodeAt(offset + 1))) {
                            type = NUMBER;
                            offset = findNumberEnd(source, offset + 2, false);
                            tokenCount--;
                            break;
                        }
                    }

                    type = code;
                    offset = offset + 1;
                }

                break;

            case NUMBER:
                offset = findNumberEnd(source, offset + 1, prevType !== FULLSTOP);
                if (prevType === FULLSTOP ||
                    prevType === HYPHENMINUS ||
                    prevType === PLUSSIGN) {
                    tokenCount--; // rewrite prev token
                }
                break;

            case STRING:
                offset = findStringEnd(source, offset + 1, code);
                break;

            default:
                offset = findIdentifierEnd(source, offset);
        }

        offsetAndType[tokenCount++] = (type << TYPE_OFFSET) | offset;
        prevType = type;
    }

    offsetAndType[tokenCount] = offset;

    scanner.offsetAndType = offsetAndType;
    scanner.tokenCount = tokenCount;
}

//
// scanner
//

var Scanner = function(source, initLine, initColumn) {
    var start = firstCharOffset(source);

    this.source = source;
    this.initLine = typeof initLine === 'undefined' ? 1 : initLine;
    this.initColumn = (typeof initColumn === 'undefined' ? 1 : initColumn) - start;
    this.lastLocationLine = this.initLine;
    this.lastLocationLineOffset = 1 - this.initColumn;
    this.lines = null;

    this.eof = false;
    this.currentToken = -1;
    this.tokenType = 0;
    this.tokenStart = start;
    this.tokenEnd = start;

    tokenLayout(this, source, start);
    this.next();
};

Scanner.prototype = {
    lookupType: function(offset) {
        offset += this.currentToken;

        if (offset < this.tokenCount) {
            return this.offsetAndType[offset] >> TYPE_OFFSET;
        }

        return NULL;
    },
    lookupValue: function(offset, referenceStr) {
        offset += this.currentToken;

        if (offset < this.tokenCount) {
            return cmpStr(
                this.source,
                this.offsetAndType[offset - 1] & OFFSET_MASK,
                this.offsetAndType[offset] & OFFSET_MASK,
                referenceStr
            );
        }

        return false;
    },

    getTokenValue: function() {
        return this.source.substring(this.tokenStart, this.tokenEnd);
    },
    substrToCursor: function(start) {
        return this.source.substring(start, this.tokenStart);
    },

    skip: function(tokenCount) {
        var next = this.currentToken + tokenCount;

        if (next < this.tokenCount) {
            this.currentToken = next;
            this.tokenStart = this.offsetAndType[next - 1] & OFFSET_MASK;
            next = this.offsetAndType[next];
            this.tokenType = next >> TYPE_OFFSET;
            this.tokenEnd = next & OFFSET_MASK;
        } else {
            this.currentToken = this.tokenCount;
            this.next();
        }
    },
    next: function() {
        var next = this.currentToken + 1;

        if (next < this.tokenCount) {
            this.currentToken = next;
            this.tokenStart = this.tokenEnd;
            next = this.offsetAndType[next];
            this.tokenType = next >> TYPE_OFFSET;
            this.tokenEnd = next & OFFSET_MASK;
        } else {
            this.currentToken = this.tokenCount;
            this.eof = true;
            this.tokenType = NULL;
            this.tokenStart = this.tokenEnd = this.source.length;
        }
    },

    eat: function(tokenType) {
        if (this.tokenType !== tokenType) {
            this.error(TokenName[tokenType] + ' is expected');
        }

        this.next();
    },
    expectIdentifier: function(name) {
        if (this.tokenType !== IDENTIFIER || cmpStr(this.source, this.tokenStart, this.tokenEnd, name) === false) {
            this.error('Identifier `' + name + '` is expected');
        }

        this.next();
    },

    getLocation: function(offset, source) {
        if (this.lines === null) {
            this.lines = computeLines(this, this.source);
        }

        var line = this.lines[offset];
        var column = offset;
        var lineOffset;

        if (line === this.initLine) {
            column += this.initColumn;
        } else {
            // try get precomputed line offset
            if (line === this.lastLocationLine) {
                lineOffset = this.lastLocationLineOffset;
            } else {
                // try avoid to compute line offset since it's expensive for long lines
                lineOffset = lastIndexOf.call(this.lines, line - 1, offset);
                this.lastLocationLine = line;
                this.lastLocationLineOffset = lineOffset;
            }

            column -= lineOffset;
        }

        return {
            source: source,
            offset: offset,
            line: line,
            column: column
        };
    },

    error: function(message, offset) {
        var location = typeof offset !== 'undefined' && offset < this.source.length
            ? this.getLocation(offset)
            : this.eof
                ? findLastNonSpaceLocation(this)
                : this.getLocation(this.tokenStart);

        throw new CssSyntaxError(
            message || 'Unexpected input',
            this.source,
            location.offset,
            location.line,
            location.column
        );
    },

    getTypes: function() {
        return Array.prototype.slice.call(this.offsetAndType, 0, this.tokenCount).map(function(item) {
            return TokenName[item >> TYPE_OFFSET];
        });
    }
};

// warm up tokenizer to elimitate code branches that never execute
// fix soft deoptimizations (insufficient type feedback)
new Scanner('\n\r\r\n\f//""\'\'/*\r\n\f*/1a;.\\31\t\+2{url(a);+1.2e3 -.4e-5 .6e+7}');

module.exports = Scanner;
