var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var WHITESPACE = TYPE.Whitespace;
var STRING = TYPE.String;
var COMMENT = TYPE.Comment;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var COMMA = TYPE.Comma;
var COLON = TYPE.Colon;
var SEMICOLON = TYPE.Semicolon;

module.exports = function AtruleExpression() {
    var start;
    var children = null;
    var wasSpace = false;
    var lastNonSpace = null;
    var child;

    this.readSC();
    start = this.scanner.tokenStart;

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

        lastNonSpace = this.scanner.tokenStart;
        children.appendData(child);
    }

    if (children === null) {
        return null;
    }

    return {
        type: 'AtruleExpression',
        loc: this.getLocation(start, lastNonSpace !== null ? lastNonSpace : this.scanner.tokenStart),
        children: children
    };
};
