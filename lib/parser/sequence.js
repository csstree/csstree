var List = require('../utils/list');
var cmpChar = require('../scanner').cmpChar;
var TYPE = require('../scanner').TYPE;

var WHITESPACE = TYPE.Whitespace;
var IDENTIFIER = TYPE.Identifier;
var STRING = TYPE.String;
var NUMBER = TYPE.Number;
var COMMENT = TYPE.Comment;
var NUMBERSIGN = TYPE.NumberSign;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var PLUSSIGN = TYPE.PlusSign;
var HYPHENMINUS = TYPE.HyphenMinus;
var COMMA = TYPE.Comma;
var SOLIDUS = TYPE.Solidus;
var PERCENTSIGN = TYPE.PercentSign;
var COLON = TYPE.Colon;
var SEMICOLON = TYPE.Semicolon;
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

function atruleExpression() {
    this.readSC();

    var children = null;
    var wasSpace = false;
    var child;

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case SEMICOLON:
            case LEFTCURLYBRACKET:
                break scan;

            case WHITESPACE:
                wasSpace = true;
                this.scanner.next();
                continue;

            case COMMENT: // ignore comments
                this.scanner.next();
                continue;

            case COMMA:
                child = this.Operator();
                break;

            case COLON:
                child = this.Pseudo();
                break;

            case LEFTPARENTHESIS:
                child = this.Parentheses(this.scopeAtruleExpression);
                break;

            case STRING:
                child = this.String();
                break;

            default:
                child = this.Any(this.scopeAtruleExpression);
        }

        if (children === null) {
            children = new List();
        }

        if (wasSpace) {
            wasSpace = false;
            children.appendData(this.SPACE_NODE);
        }

        children.appendData(child);
    }

    return children;
}

function value() {
    var children = new List();
    var wasSpace = false;
    var child;

    this.readSC();

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
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
            case PLUSSIGN:
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

            case HYPHENMINUS:
                if (this.scanner.lookupType(1) === IDENTIFIER) {
                    if (this.scanner.lookupType(2) === LEFTPARENTHESIS) {
                        child = this.Function(this.scopeValue);
                    } else {
                        child = this.Identifier(DISALLOW_VAR);
                    }
                } else {
                    child = this.Operator();
                }

                break;

            case NUMBER:
                switch (this.scanner.lookupType(1)) {
                    case PERCENTSIGN:
                        child = this.Percentage();
                        break;

                    case IDENTIFIER:
                        child = this.Dimension();
                        break;

                    default:
                        child = this.Number();
                        break;
                }

                break;

            case IDENTIFIER:
                // check for unicode range, it should start with u+ or U+
                if (cmpChar(this.scanner.source, this.scanner.tokenStart, U) &&
                    cmpChar(this.scanner.source, this.scanner.tokenStart + 1, PLUSSIGN)) {
                    child = this.UnicodeRange();
                } else if (this.scanner.lookupType(1) === LEFTPARENTHESIS) {
                    child = this.Function(this.scopeValue);
                } else {
                    child = this.Identifier(DISALLOW_VAR);
                }

                break;

            default:
                break scan;
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
    value: value,
    atruleExpression: atruleExpression
};
