var List = require('../utils/list');
var cmpChar = require('../scanner').cmpChar;
var TYPE = require('../scanner').TYPE;

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
var SOLIDUS = TYPE.Solidus;
var SEMICOLON = TYPE.Semicolon;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var RIGHTCURLYBRACKET = TYPE.RightCurlyBracket;
var U = 117; // 'u'.charCodeAt(0)

var ABSOLUTE = false;
var RELATIVE = true;
var ALLOW_OF_CLAUSE = true;
var DISALLOW_OF_CLAUSE = false;
var DISALLOW_VAR = false;

function singleIdentifier() {
    return new List().appendData(
        this.Identifier(DISALLOW_VAR)
    );
}

function selectorList() {
    return new List().appendData(
        this.SelectorList(ABSOLUTE)
    );
}

function relativeSelectorList() {
    return new List().appendData(
        this.SelectorList(RELATIVE)
    );
}

function nth() {
    return new List().appendData(
        this.Nth(DISALLOW_OF_CLAUSE)
    );
}

function nthWithOfClause() {
    return new List().appendData(
        this.Nth(ALLOW_OF_CLAUSE)
    );
}

function value(nested) {
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

    return children;
}

module.exports = {
    singleIdentifier: singleIdentifier,
    selectorList: selectorList,
    relativeSelectorList: relativeSelectorList,
    nth: nth,
    nthWithOfClause: nthWithOfClause,
    value: value
};
