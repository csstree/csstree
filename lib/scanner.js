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

var ShortArray = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
var LongArray = typeof Uint32Array !== 'undefined' && typeof Uint32Array.prototype.lastIndexOf === 'function'
    ? Uint32Array
    : Array;

function linesLayout(scanner, source, start) {
    var sourceLength = source.length;
    var line = scanner.initLine;
    var lines = new LongArray(source.length + 1);

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

    lines[sourceLength] = line;

    scanner.lines = lines;
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
    for (; offset < source.length; offset++) {
        var starOffset = source.indexOf('*', offset);

        if (starOffset === -1) {
            offset = source.length;
            break;
        }

        offset = starOffset;
        if (source.charCodeAt(offset + 1) === SLASH) {
            return offset + 2;
        }
    }

    return offset;
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

function findIdentifierEnd(source, offset) {
    for (; offset < source.length; offset++) {
        var code = source.charCodeAt(offset);

        if (code === BACK_SLASH) {
            offset++;

            // skip escaped unicode sequence that can ends with space
            // [0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?
            for (var i = 0; i < 7 && offset + i < source.length; i++) {
                code = source.charCodeAt(offset + i);

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
        } else if (code < SYMBOL_CATEGORY_LENGTH && IS_PUNCTUATOR[code] === PUNCTUATOR) {
            break;
        }
    }

    return offset;
}

function tokenLayout(scanner, source, startPos) {
    var sourceLength = source.length;
    var offsets = new LongArray(sourceLength + 1);
    var types = new ShortArray(sourceLength);
    var tokenCount = 0;
    var start = startPos;
    var prev = 0;
    var end;

    offsets[sourceLength] = sourceLength;

    while (start < sourceLength) {
        var code = source.charCodeAt(start);
        var type = code < SYMBOL_CATEGORY_LENGTH ? SYMBOL_CATEGORY[code] : IDENTIFIER;

        switch (type) {
            case WHITESPACE:
                end = findWhitespaceEnd(source, start + 1);
                break;

            case PUNCTUATOR:
                if (code === STAR && prev === SLASH) { // /*
                    type = COMMENT;
                    end = findCommentEnd(source, start + 1);

                    // rewrite prev token
                    tokenCount--;
                    start--;
                    break;
                }

                type = code;
                end = start + 1;
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
        offsets[tokenCount] = start;
        types[tokenCount] = type;

        tokenCount++;
        start = end;
        prev = type;
    }

    offsets[tokenCount] = end;

    scanner.types = types;
    scanner.offsets = offsets;
    scanner.tokenCount = tokenCount;
}

//
// scanner
//

var Scanner = function(source, initLine, initColumn) {
    var start = source.charCodeAt(0) === 0xFEFF ? 1 : 0;

    this.source = source;
    this.initLine = typeof initLine === 'undefined' ? 1 : initLine;
    this.initColumn = (typeof initColumn === 'undefined' ? 1 : initColumn) - start;

    linesLayout(this, source, start);
    tokenLayout(this, source, start);

    this.eof = false;
    this.currentToken = -1;
    this.tokenType = 0;
    this.tokenStart = start;
    this.tokenEnd = start;
    this.next();
};

Scanner.prototype = {
    lookupType: function(offset) {
        offset += this.currentToken;

        if (offset < this.tokenCount) {
            return this.types[offset];
        }

        return 0;
    },
    lookupValue: function(offset, referenceStr) {
        offset += this.currentToken;

        if (offset < this.tokenCount) {
            return cmpStr(this.source, this.offsets[offset], this.offsets[offset + 1], referenceStr);
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
            this.tokenType = this.types[next];
            this.tokenStart = this.offsets[next];
            this.tokenEnd = this.offsets[next + 1];
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
            this.tokenType = this.types[next];
            this.tokenStart = this.tokenEnd;
            this.tokenEnd = this.offsets[next + 1];
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
    expectIdentifier: function(name, eat) {
        if (this.tokenType === IDENTIFIER && cmpStr(this.source, this.tokenStart, this.tokenEnd, name)) {
            if (eat) {
                this.next();
            }

            return true;
        }

        this.error('Identifier `' + name + '` is expected');
    },
    expectAny: function(what) {
        for (var i = 1, type = this.tokenType; i < arguments.length; i++) {
            if (type === arguments[i]) {
                return true;
            }
        }

        this.error(what + ' is expected');
    },

    getLocation: function(offset, source) {
        var line = this.lines[offset];
        var column = line === this.initLine
            ? offset + this.initColumn
            : offset - this.lines.lastIndexOf(line - 1, offset);

        return {
            source: source,
            offset: offset,
            line: line,
            column: column
        };
    },
    findLastNonSpaceLocation: function() {
        for (var i = this.offsets[this.currentToken] - 1; i >= 0; i--) {
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
new Scanner('\n\r\r\n\f//""\'\'/*\r\n\f*/1a;.{url(a)}');

module.exports = Scanner;
