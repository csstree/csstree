var List = require('../utils/list');
var cmpChar = require('../tokenizer').cmpChar;
var TYPE = require('../tokenizer').TYPE;

var WHITESPACE = TYPE.Whitespace;
var IDENTIFIER = TYPE.Identifier;
var STRING = TYPE.String;
var NUMBER = TYPE.Number;
var COMMENT = TYPE.Comment;
var NUMBERSIGN = TYPE.NumberSign;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var PLUSSIGN = TYPE.PlusSign;
var HYPHENMINUS = TYPE.HyphenMinus;
var COMMA = TYPE.Comma;
var SOLIDUS = TYPE.Solidus;
var ASTERISK = TYPE.Asterisk;
var PERCENTSIGN = TYPE.PercentSign;
var U = 117; // 'u'.charCodeAt(0)

var ALLOW_OF_CLAUSE = true;
var DISALLOW_OF_CLAUSE = false;

function singleIdentifier() {
    return new List().appendData(
        this.Identifier()
    );
}

function selectorList() {
    return new List().appendData(
        this.SelectorList()
    );
}

function relativeSelectorList() {
    return new List().appendData(
        this.SelectorList()
    );
}

function compoundSelector() {
    return new List().appendData(
        this.Selector()
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

function defaultSequence(scope) {
    var children = new List();
    var space = null;
    var nonWSOperator = false;
    var prevNonWSOperator = false;
    var child;

    this.readSC();

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case WHITESPACE:
                space = this.WhiteSpace();
                continue;

            case COMMENT: // ignore comments
                this.scanner.next();
                continue;

            case NUMBERSIGN:
                child = this.HexColor();
                break;

            case COMMA:
                space = null;
                nonWSOperator = true;
                child = this.Operator();
                break;

            case SOLIDUS:
            case ASTERISK:
            case PLUSSIGN:
            case HYPHENMINUS:
                child = this.Operator();
                break;

            case LEFTPARENTHESIS:
                child = this.Parentheses(defaultSequence);
                break;

            case LEFTSQUAREBRACKET:
                child = this.Brackets(defaultSequence);
                break;

            case STRING:
                child = this.String();
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
                }

                break;

            case IDENTIFIER:
                // check for unicode range, it should start with u+ or U+
                if (cmpChar(this.scanner.source, this.scanner.tokenStart, U) &&
                    cmpChar(this.scanner.source, this.scanner.tokenStart + 1, PLUSSIGN)) {
                    child = this.UnicodeRange();
                } else if (this.scanner.lookupType(1) === LEFTPARENTHESIS) {
                    if (this.scanner.lookupValue(0, 'url')) {
                        child = this.Url();
                    } else {
                        child = this.Function(scope, defaultSequence);
                    }
                } else {
                    child = this.Identifier();
                }

                break;

            default:
                break scan;
        }

        if (space !== null) {
            // ignore spaces around operator
            if (!nonWSOperator && !prevNonWSOperator) {
                children.appendData(space);
            }

            space = null;
        }

        children.appendData(child);
        prevNonWSOperator = nonWSOperator;
        nonWSOperator = false;
    }

    return children;
}

module.exports = {
    singleIdentifier: singleIdentifier,
    selectorList: selectorList,
    relativeSelectorList: relativeSelectorList,
    compoundSelector: compoundSelector,
    nth: nth,
    nthWithOfClause: nthWithOfClause,
    default: defaultSequence
};
