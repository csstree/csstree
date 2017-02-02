var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var WHITESPACE = TYPE.Whitespace;
var STRING = TYPE.String;
var COMMENT = TYPE.Comment;
var NUMBERSIGN = TYPE.NumberSign;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var ASTERISK = TYPE.Asterisk;
var COMMA = TYPE.Comma;
var SOLIDUS = TYPE.Solidus;
var DISALLOW_VAR = false;

// ident '(' functionBody ')'
module.exports = function Function(scope, readSequence) {
    // parse special functions
    var start = this.scanner.tokenStart;
    var name = this.readIdent(DISALLOW_VAR);
    var nameLowerCase = name.toLowerCase();

    switch (scope) {
        case this.scopeValue:
            if (this.scopeValue.hasOwnProperty(nameLowerCase)) {
                return this.scopeValue[nameLowerCase].call(this, scope, start, name, getFunctionInternal);
            }
            break;
        case this.scopeAtruleExpression:
            if (this.scopeAtruleExpression.hasOwnProperty(nameLowerCase)) {
                return this.scopeAtruleExpression[nameLowerCase].call(this, scope, start, name, getFunctionInternal);
            }
            break;
    }

    return getFunctionInternal.call(this, readSequence || getFunctionArguments, scope, start, name);
};

function getFunctionInternal(readSequence, scope, start, name) {
    var children;

    this.scanner.eat(LEFTPARENTHESIS);
    children = readSequence.call(this, scope);
    this.scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'Function',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: name,
        children: children
    };
}

function getFunctionArguments(scope) {
    var children = new List();
    var wasSpace = false;
    var prevNonSpaceOperator = false;
    var nonSpaceOperator = false;
    var child;

    this.readSC();

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case RIGHTPARENTHESIS:
                break scan;

            case WHITESPACE:
                wasSpace = true;
                this.scanner.next();
                continue;

            case COMMENT: // ignore comments
                this.scanner.next();
                continue;

            case NUMBERSIGN: // TODO: not sure it should be here
                child = this.Hash();
                break;

            case LEFTPARENTHESIS:
                child = this.Parentheses(scope);
                break;

            case COMMA:
            case SOLIDUS:
            case ASTERISK:
                wasSpace = false;
                nonSpaceOperator = true;
                child = this.Operator();
                break;

            case STRING:
                child = this.String();
                break;

            default:
                child = this.Any(scope);
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
