var List = require('../../utils/list');
var endsWith = require('../../scanner').endsWith;
var cmpChar = require('../../scanner').cmpChar;
var TYPE = require('../../scanner').TYPE;

var WHITESPACE = TYPE.Whitespace;
var IDENTIFIER = TYPE.Identifier;
var STRING = TYPE.String;
var COMMENT = TYPE.Comment;
var EXCLAMATIONMARK = TYPE.ExclamationMark;
var NUMBERSIGN = TYPE.NumberSign;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var PLUSSIGN = TYPE.PlusSign;
var COMMA = TYPE.Comma;
var FULLSTOP = TYPE.FullStop;
var SOLIDUS = TYPE.Solidus;
var COLON = TYPE.Colon;
var SEMICOLON = TYPE.Semicolon;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
var U = 117; // 'u'.charCodeAt(0)

module.exports = function Value(nested, property) {
    // special parser for filter property since it can contains non-standart syntax for old IE
    if (property !== null && endsWith(property, 'filter') && checkProgid.call(this)) {
        return FilterValue.call(this);
    }

    var start = this.scanner.tokenStart;
    var children = new List();
    var wasSpace = false;
    var child;

    this.readSC();

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case RIGHTCURLYBRACKET:
            case SEMICOLON:
            case EXCLAMATIONMARK:
                break scan;

            case RIGHTPARENTHESIS:
                if (!nested) {
                    this.scanner.error();
                }

                break scan;

            case WHITESPACE:
                wasSpace = true;
                this.scanner.next();
                continue;

            case COMMENT: // ignore comments
                this.scanner.next();
                continue;

            case NUMBERSIGN:
                child = this.Hash();
                break;

            case SOLIDUS:
            case COMMA:
                child = this.Operator();
                break;

            case LEFTPARENTHESIS:
                child = this.Parentheses(this.scopeValue);
                break;

            case LEFTSQUAREBRACKET:
                child = this.Brackets();
                break;

            case STRING:
                child = this.String();
                break;

            default:
                // check for unicode range, it should start with u+ or U+
                if (this.scanner.tokenType === IDENTIFIER &&
                    cmpChar(this.scanner.source, this.scanner.tokenStart, U) &&
                    cmpChar(this.scanner.source, this.scanner.tokenStart + 1, PLUSSIGN)) {
                    child = this.UnicodeRange();
                    break;
                }

                child = this.Any(this.scopeValue);
        }

        if (wasSpace) {
            wasSpace = false;
            children.appendData(this.SPACE_NODE);
        }

        children.appendData(child);
    }

    return {
        type: 'Value',
        loc: this.getLocation(start, this.scanner.tokenStart),
        children: children
    };
};

function FilterValue() {
    var start = this.scanner.tokenStart;
    var children = new List();
    var progid;

    while (progid = checkProgid.call(this)) {
        this.readSC();
        children.appendData(this.Progid(progid));
    }

    this.readSC();

    return {
        type: 'Value',
        loc: this.getLocation(start, this.scanner.tokenStart),
        children: children
    };
}

function findNonSCOffset(offset) {
    for (var type; type = this.scanner.lookupType(offset); offset++) {
        if (type !== WHITESPACE && type !== COMMENT) {
            break;
        }
    }

    return offset;
}

// 'progid:' ws* 'DXImageTransform.Microsoft.' ident ws* '(' .* ')'
function checkProgid() {
    var startOffset = findNonSCOffset.call(this, 0);
    var offset = startOffset;

    if (this.scanner.lookupValue(offset, 'alpha') ||
        this.scanner.lookupValue(offset, 'dropshadow')) {
        offset++;
    } else {
        if (this.scanner.lookupValue(offset, 'progid') === false ||
            this.scanner.lookupType(offset + 1) !== COLON) {
            return false; // fail
        }

        offset += 2;
        offset = findNonSCOffset.call(this, offset);

        if (this.scanner.lookupValue(offset + 0, 'dximagetransform') === false ||
            this.scanner.lookupType(offset + 1) !== FULLSTOP ||
            this.scanner.lookupValue(offset + 2, 'microsoft') === false ||
            this.scanner.lookupType(offset + 3) !== FULLSTOP ||
            this.scanner.lookupType(offset + 4) !== IDENTIFIER) {
            return false; // fail
        }

        offset += 5;
        offset = findNonSCOffset.call(this, offset);
    }

    if (this.scanner.lookupType(offset) !== LEFTPARENTHESIS) {
        return false; // fail
    }

    for (var type; type = this.scanner.lookupType(offset); offset++) {
        if (type === RIGHTPARENTHESIS) {
            return offset - startOffset + 1;
        }
    }

    return false;
}
