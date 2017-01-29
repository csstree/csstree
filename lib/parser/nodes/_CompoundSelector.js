var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var WHITESPACE = TYPE.Whitespace;
var IDENTIFIER = TYPE.Identifier;
var COMMENT = TYPE.Comment;
var NUMBERSIGN = TYPE.NumberSign;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var ASTERISK = TYPE.Asterisk;
var COMMA = TYPE.Comma;
var FULLSTOP = TYPE.FullStop;
var COLON = TYPE.Colon;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var VERTICALLINE = TYPE.VerticalLine;
var HYPHENMINUS = TYPE.HyperMinus;

module.exports = function CompoundSelector(nested) {
    var start = this.scanner.tokenStart;
    var children = new List();
    var child;

    this.readSC();

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case COMMA:
                break scan;

            case LEFTCURLYBRACKET:
                if (nested) {
                    this.scanner.error();
                }

                break scan;

            case RIGHTPARENTHESIS:
                if (!nested) {
                    this.scanner.error();
                }

                break scan;

            case COMMENT:
                this.scanner.next();
                continue;

            case WHITESPACE:
                this.readSC();
                break scan;

            case FULLSTOP:
                child = this.Class();
                break;

            case LEFTSQUAREBRACKET:
                child = this.Attribute();
                break;

            case NUMBERSIGN:
                child = this.Id();
                break;

            case COLON:
                child = this.Pseudo();
                break;

            case HYPHENMINUS:
            case IDENTIFIER:
            case ASTERISK:
            case VERTICALLINE:
                child = this.TypeOrUniversal();
                break;

            default:
                this.scanner.error();
        }

        children.appendData(child);
    }

    if (children.isEmpty()) {
        this.scanner.error('Simple selector expected');
    }

    return {
        type: 'Selector',
        loc: this.getLocation(start, this.scanner.tokenStart),
        children: children
    };
};
