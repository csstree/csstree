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
var FULLSTOP = TYPE.FullStop;
var COLON = TYPE.Colon;
var GREATERTHANSIGN = TYPE.GreaterThanSign;
var VERTICALLINE = TYPE.VerticalLine;
var TILDE = TYPE.Tilde;
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

function selectorSequence() {
    var children = new List();
    var space = null;
    var child = null;
    var ignoreWSAfter = false;
    var ignoreWS = false;

    this.readSC();

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case COMMENT:
                this.scanner.next();
                continue;

            case WHITESPACE:
                if (ignoreWS) {
                    this.scanner.next();
                } else {
                    space = this.WhiteSpace();
                }
                continue;

            case PLUSSIGN:
            case GREATERTHANSIGN:
            case TILDE:
                space = null;
                ignoreWSAfter = true;
                child = this.Combinator();
                break;

            case SOLIDUS:  // /deep/
                child = this.Combinator();
                break;

            case FULLSTOP:
                child = this.ClassSelector();
                break;

            case LEFTSQUAREBRACKET:
                child = this.AttributeSelector();
                break;

            case NUMBERSIGN:
                child = this.IdSelector();
                break;

            case COLON:
                if (this.scanner.lookupType(1) === COLON) {
                    child = this.PseudoElementSelector();
                } else {
                    child = this.PseudoClassSelector();
                }

                break;

            case IDENTIFIER:
            case ASTERISK:
            case VERTICALLINE:
                child = this.TypeSelector();
                break;

            case NUMBER:
                child = this.Percentage();
                break;

            default:
                if (typeof this.readSelectorSequenceFallback === 'function') {
                    child = this.readSelectorSequenceFallback();
                    if (!child) {
                        break scan;
                    }
                } else {
                    break scan;
                }
        }

        if (space !== null) {
            children.appendData(space);
            space = null;
        }

        children.appendData(child);

        if (ignoreWSAfter) {
            ignoreWSAfter = false;
            ignoreWS = true;
        } else {
            ignoreWS = false;
        }
    }

    // nothing were consumed
    if (child === null) {
        this.scanner.error('Selector is expected');
    }

    return children;
}

function defaultSequence(scope) {
    var children = new List();
    var space = null;
    var child = null;
    var ignoreWSAfter = false;
    var ignoreWS = false;

    this.readSC();

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case COMMENT:
                this.scanner.next();
                continue;

            case WHITESPACE:
                if (ignoreWS) {
                    this.scanner.next();
                } else {
                    space = this.WhiteSpace();
                }
                continue;

            case NUMBERSIGN:
                child = this.HexColor();
                break;

            case COMMA:
                space = null;
                ignoreWSAfter = true;
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
                if (typeof this.readSequenceFallback === 'function') {
                    child = this.readSequenceFallback();
                    if (!child) {
                        break scan;
                    }
                } else {
                    break scan;
                }
        }

        if (space !== null) {
            children.appendData(space);
            space = null;
        }

        children.appendData(child);

        if (ignoreWSAfter) {
            ignoreWSAfter = false;
            ignoreWS = true;
        } else {
            ignoreWS = false;
        }
    }

    return children;
}

module.exports = {
    singleIdentifier: singleIdentifier,
    selectorList: selectorList,
    compoundSelector: compoundSelector,
    nth: nth,
    nthWithOfClause: nthWithOfClause,
    selector: selectorSequence,
    default: defaultSequence
};
