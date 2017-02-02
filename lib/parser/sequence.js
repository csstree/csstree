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
var PLUSSIGN = TYPE.PlusSign;
var HYPHENMINUS = TYPE.HyphenMinus;
var COMMA = TYPE.Comma;
var SOLIDUS = TYPE.Solidus;
var ASTERISK = TYPE.Asterisk;
var PERCENTSIGN = TYPE.PercentSign;
var U = 117; // 'u'.charCodeAt(0)

var ABSOLUTE = false;
var RELATIVE = true;
var ALLOW_OF_CLAUSE = true;
var DISALLOW_OF_CLAUSE = false;
var DISALLOW_VAR = false;
var DISALLOW_COMBINATORS = true;

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

function compoundSelectorList() {
    return new List().appendData(
        this.Selector(ABSOLUTE, DISALLOW_COMBINATORS)
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
    var wasSpace = false;
    var nonSpaceOperator = false;
    var prevNonSpaceOperator = false;
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

            case COMMA:
                wasSpace = false;
                nonSpaceOperator = true;
                child = this.Operator();
                break;

            case SOLIDUS:
            case ASTERISK:
            case PLUSSIGN:
                child = this.Operator();
                break;

            case HYPHENMINUS:
                if (this.scanner.lookupType(1) === IDENTIFIER) {
                    if (this.scanner.lookupType(2) === LEFTPARENTHESIS) {
                        child = this.Function(scope, defaultSequence);
                    } else {
                        child = this.Identifier(DISALLOW_VAR);
                    }
                } else {
                    child = this.Operator();
                }

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
                        break;
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
                    child = this.Identifier(DISALLOW_VAR);
                }

                break;

            default:
                break scan;
        }

        if (wasSpace) {
            wasSpace = false;

            // ignore spaces around operator
            if (!nonSpaceOperator && !prevNonSpaceOperator) {
                children.appendData(this.SPACE_NODE);
            }
        }

        children.appendData(child);
        prevNonSpaceOperator = nonSpaceOperator;
        nonSpaceOperator = false;
    }

    return children;
}

module.exports = {
    singleIdentifier: singleIdentifier,
    selectorList: selectorList,
    relativeSelectorList: relativeSelectorList,
    compoundSelectorList: compoundSelectorList,
    nth: nth,
    nthWithOfClause: nthWithOfClause,
    default: defaultSequence
};
