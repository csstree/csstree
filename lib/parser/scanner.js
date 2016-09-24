'use strict';

var CssSyntaxError = require('./error');
var TokenType = require('./const').TokenType;
var TokenName = require('./const').TokenName;
var IS_PUNCTUATOR = require('./const').IS_PUNCTUATOR;
var SYMBOL_CATEGORY = require('./const').SYMBOL_CATEGORY;
var SYMBOL_CATEGORY_LENGTH = SYMBOL_CATEGORY.length;
var cmpStr = require('./utils').cmpStr;
var isHex = require('./utils').isHex;

var NULL = 0;
var WHITESPACE = TokenType.Whitespace;
var IDENTIFIER = TokenType.Identifier;
var NUMBER = TokenType.DecimalNumber;
var STRING = TokenType.String;
var COMMENT = TokenType.Comment;
var PUNCTUATOR = TokenType.Punctuator;

var TAB = 9;
var N = 10;
var F = 12;
var R = 13;
var SPACE = 32;
var STAR = 42;
var SLASH = 47;
var BACK_SLASH = 92;

var MIN_ARRAY_SIZE = 16 * 1024;
var OFFSET_MASK = 0x00FFFFFF;
var lastIndexOf = Array.prototype.lastIndexOf; // some browser implementations have no TypedArray#lastIndexOf
var LongArray = typeof Uint32Array !== 'undefined' ? Uint32Array : Array;

var offsetAndType = new LongArray(MIN_ARRAY_SIZE);
var lines = null;

function firstCharOffset(source) {
    return source.charCodeAt(0) === 0xFEFF ? 1 : 0;
}

function computeLines(scanner, source) {
    var sourceLength = source.length;
    var start = firstCharOffset(source);
    var line = scanner.initLine;

    if (lines === null || lines.length < sourceLength + 1) {
        lines = new LongArray(Math.max(sourceLength + 1024, MIN_ARRAY_SIZE));
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
        } else if (code < SYMBOL_CATEGORY_LENGTH && IS_PUNCTUATOR[code] === PUNCTUATOR) {
            break;
        }
    }

    return offset;
}

function tokenLayout(scanner, source, startPos) {
    var sourceLength = source.length;
    var tokenCount = 0;
    var prevType = 0;
    var start = startPos;
    var end;

    if (offsetAndType.length < sourceLength + 1) {
        offsetAndType = new LongArray(sourceLength + 1024);
    }

    while (start < sourceLength) {
        var code = source.charCodeAt(start);
        var type = code < SYMBOL_CATEGORY_LENGTH ? SYMBOL_CATEGORY[code] : IDENTIFIER;

        switch (type) {
            case WHITESPACE:
                end = findWhitespaceEnd(source, start + 1);
                break;

            case PUNCTUATOR:
                if (code === STAR && prevType === SLASH) { // /*
                    type = COMMENT;
                    end = findCommentEnd(source, start + 1);

                    // rewrite prevType token
                    tokenCount--;
                    prevType = offsetAndType[tokenCount] >> 24;
                    start--;
                } else {
                    type = code;
                    end = start + 1;
                }

                break;

            case NUMBER:
                end = findDecimalNumberEnd(source, start + 1);
                break;

            case STRING:
                end = findStringEnd(source, start + 1, code);
                break;

            default:
                end = findIdentifierEnd(source, start);
        }

        // console.log(type, scanner.source.substring(start, end));
        offsetAndType[tokenCount] = (prevType << 24) | start;

        tokenCount++;
        start = end;
        prevType = type;
    }

    offsetAndType[tokenCount] = (prevType << 24) | end;

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
            return this.offsetAndType[offset + 1] >> 24;
        }

        return 0;
    },
    lookupValue: function(offset, referenceStr) {
        offset += this.currentToken;

        if (offset < this.tokenCount) {
            return cmpStr(
                this.source,
                this.offsetAndType[offset] & OFFSET_MASK,
                this.offsetAndType[offset + 1] & OFFSET_MASK,
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
        if (tokenCount === 1) {
            this.next();
            return;
        }

        var next = this.currentToken + tokenCount;

        if (next < this.tokenCount) {
            this.currentToken = next;
            this.tokenStart = this.offsetAndType[next] & OFFSET_MASK;
            next = this.offsetAndType[next + 1];
            this.tokenType = next >> 24;
            this.tokenEnd = next & OFFSET_MASK;
        } else {
            this.currentToken = this.tokenCount;
            this.eof = true;
            this.tokenType = NULL;
            this.tokenStart = this.tokenEnd = this.source.length;
        }
    },
    next: function() {
        var next = this.currentToken + 1;

        if (next < this.tokenCount) {
            this.currentToken = next;
            this.tokenStart = this.tokenEnd;
            next = this.offsetAndType[next + 1];
            this.tokenType = next >> 24;
            this.tokenEnd = next & OFFSET_MASK;
        } else {
            this.currentToken = this.tokenCount;
            this.eof = true;
            this.tokenType = NULL;
            this.tokenStart = this.tokenEnd = this.source.length;
        }
    },

    eat: function(tokenType) {
        if (this.tokenType === tokenType) {
            this.next();
            return true;
        }

        this.error(TokenName[tokenType] + ' is expected');
    },
    expectIdentifier: function(name) {
        if (this.tokenType === IDENTIFIER && cmpStr(this.source, this.tokenStart, this.tokenEnd, name)) {
            this.next();
            return true;
        }

        this.error('Identifier `' + name + '` is expected');
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
    findLastNonSpaceLocation: function() {
        for (var i = (this.offsetAndType[this.currentToken] & OFFSET_MASK) - 1; i >= 0; i--) {
            var code = this.source.charCodeAt(i);

            if (code !== SPACE && code !== TAB && code !== R && code !== N && code !== F) {
                break;
            }
        }

        return this.getLocation(i + 1);
    },

    error: function(message, offset) {
        var location = !this.eof
            ? this.getLocation(typeof offset !== 'undefined' ? offset : this.tokenStart)
            : this.findLastNonSpaceLocation();

        throw new CssSyntaxError(
            message,
            this.source,
            location.offset,
            location.line,
            location.column
        );
    }
};

// warm up tokenizer to elimitate code branches that never execute
// fix soft deoptimizations (insufficient type feedback)
new Scanner('\n\r\r\n\f//""\'\'/*\r\n\f*/1a;.\\31\t\+2{url(a)}');

module.exports = Scanner;
