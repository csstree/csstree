'use strict';

var CssSyntaxError = require('./error');

var constants = require('./const');
var TYPE = constants.TYPE;
var NAME = constants.NAME;
var SYMBOL_TYPE = constants.SYMBOL_TYPE;
var SYMBOL_TYPE_LENGTH = SYMBOL_TYPE.length;

var utils = require('./utils');
var firstCharOffset = utils.firstCharOffset;
var cmpStr = utils.cmpStr;
var isNumber = utils.isNumber;
var findLastNonSpaceLocation = utils.findLastNonSpaceLocation;
var findWhitespaceEnd = utils.findWhitespaceEnd;
var findCommentEnd = utils.findCommentEnd;
var findStringEnd = utils.findStringEnd;
var findNumberEnd = utils.findNumberEnd;
var findIdentifierEnd = utils.findIdentifierEnd;

var NULL = 0;
var WHITESPACE = TYPE.Whitespace;
var IDENTIFIER = TYPE.Identifier;
var NUMBER = TYPE.Number;
var STRING = TYPE.String;
var COMMENT = TYPE.Comment;
var PUNCTUATOR = TYPE.Punctuator;

var N = 10;
var F = 12;
var R = 13;
var STAR = 42;
var SLASH = 47;
var FULLSTOP = TYPE.FullStop;
var PLUSSIGN = TYPE.PlusSign;
var HYPHENMINUS = TYPE.HyphenMinus;

var MIN_BUFFER_SIZE = 16 * 1024;
var OFFSET_MASK = 0x00FFFFFF;
var TYPE_OFFSET = 24;
var SafeUint32Array = typeof Uint32Array !== 'undefined' ? Uint32Array : Array; // fallback on Array when TypedArray is not supported

function computeLinesAndColumns(scanner, source) {
    var sourceLength = source.length;
    var start = firstCharOffset(source);
    var lines = scanner.lines;
    var line = scanner.initLine;
    var columns = scanner.columns;
    var column = scanner.initColumn;

    if (lines === null || lines.length < sourceLength + 1) {
        lines = new SafeUint32Array(Math.max(sourceLength + 1024, MIN_BUFFER_SIZE));
        columns = new SafeUint32Array(lines.length);
    }

    for (var i = start; i < sourceLength; i++) {
        var code = source.charCodeAt(i);

        lines[i] = line;
        columns[i] = column++;

        if (code === N || code === R || code === F) {
            if (code === R && i + 1 < sourceLength && source.charCodeAt(i + 1) === N) {
                i++;
                lines[i] = line;
                columns[i] = column;
            }

            line++;
            column = 1;
        }
    }

    lines[i] = line;
    columns[i] = column;

    scanner.linesAnsColumnsComputed = true;
    scanner.lines = lines;
    scanner.columns = columns;
}

function tokenLayout(scanner, source, startPos) {
    var sourceLength = source.length;
    var offsetAndType = scanner.offsetAndType;
    var tokenCount = 0;
    var prevType = 0;
    var offset = startPos;

    if (offsetAndType === null || offsetAndType.length < sourceLength + 1) {
        offsetAndType = new SafeUint32Array(sourceLength + 1024);
    }

    while (offset < sourceLength) {
        var code = source.charCodeAt(offset);
        var type = code < SYMBOL_TYPE_LENGTH ? SYMBOL_TYPE[code] : IDENTIFIER;

        switch (type) {
            case WHITESPACE:
                offset = findWhitespaceEnd(source, offset + 1);
                break;

            case PUNCTUATOR:
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
    this.offsetAndType = null;
    this.lines = null;
    this.columns = null;

    this.setSource(source || '', initLine, initColumn);
};

Scanner.prototype = {
    setSource: function(source, initLine, initColumn) {
        var start = firstCharOffset(source);

        this.source = source;
        this.initLine = typeof initLine === 'undefined' ? 1 : initLine;
        this.initColumn = typeof initColumn === 'undefined' ? 1 : initColumn;
        this.linesAnsColumnsComputed = false;

        this.eof = false;
        this.currentToken = -1;
        this.tokenType = 0;
        this.tokenStart = start;
        this.tokenEnd = start;

        tokenLayout(this, source, start);
        this.next();
    },

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
            this.error(NAME[tokenType] + ' is expected');
        }

        this.next();
    },
    expectIdentifier: function(name) {
        if (this.tokenType !== IDENTIFIER || cmpStr(this.source, this.tokenStart, this.tokenEnd, name) === false) {
            this.error('Identifier `' + name + '` is expected');
        }

        this.next();
    },

    getLocation: function(offset, filename) {
        if (!this.linesAnsColumnsComputed) {
            computeLinesAndColumns(this, this.source);
        }

        return {
            source: filename,
            offset: offset,
            line: this.lines[offset],
            column: this.columns[offset]
        };
    },

    getLocationRange: function(start, end, filename) {
        if (!this.linesAnsColumnsComputed) {
            computeLinesAndColumns(this, this.source);
        }

        return {
            source: filename,
            start: {
                offset: start,
                line: this.lines[start],
                column: this.columns[start]
            },
            end: {
                offset: end,
                line: this.lines[end],
                column: this.columns[end]
            }
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
            return NAME[item >> TYPE_OFFSET];
        });
    }
};

// extend scanner with constants
Object.keys(constants).forEach(function(key) {
    Scanner[key] = constants[key];
});

// extend scanner with static methods from utils
Object.keys(utils).forEach(function(key) {
    Scanner[key] = utils[key];
});

// warm up tokenizer to elimitate code branches that never execute
// fix soft deoptimizations (insufficient type feedback)
new Scanner('\n\r\r\n\f//""\'\'/*\r\n\f*/1a;.\\31\t\+2{url(a);+1.2e3 -.4e-5 .6e+7}');

module.exports = Scanner;
