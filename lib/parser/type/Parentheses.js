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
var COLON = TYPE.Colon;

module.exports = function Parentheses(scope) {
    var start = this.scanner.tokenStart;
    var children = new List();
    var wasSpace = false;
    var child;

    // left parenthesis
    this.scanner.eat(LEFTPARENTHESIS);
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

            case LEFTPARENTHESIS:
                child = this.Parentheses(scope);
                break;

            case SOLIDUS:
            case ASTERISK:
            case COMMA:
            case COLON:
                child = this.Operator();
                break;

            case NUMBERSIGN:
                child = this.Hash();
                break;

            case STRING:
                child = this.String();
                break;

            default:
                child = this.Any(scope);
        }

        if (wasSpace) {
            wasSpace = false;
            children.appendData(this.SPACE_NODE);
        }

        children.appendData(child);
    }

    // right parenthesis
    this.scanner.eat(RIGHTPARENTHESIS);

    return {
        type: 'Parentheses',
        loc: this.getLocation(start, this.scanner.tokenStart),
        children: children
    };
};
