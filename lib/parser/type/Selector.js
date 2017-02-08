var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var WHITESPACE = TYPE.Whitespace;
var IDENTIFIER = TYPE.Identifier;
var NUMBER = TYPE.Number;
var COMMENT = TYPE.Comment;
var NUMBERSIGN = TYPE.NumberSign;
var ASTERISK = TYPE.Asterisk;
var PLUSSIGN = TYPE.PlusSign;
var FULLSTOP = TYPE.FullStop;
var SOLIDUS = TYPE.Solidus;
var COLON = TYPE.Colon;
var GREATERTHANSIGN = TYPE.GreaterThanSign;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var VERTICALLINE = TYPE.VerticalLine;
var TILDE = TYPE.Tilde;

module.exports = function Selector() {
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
                break scan;
        }

        if (space !== null) {
            children.appendData(space);
            space = null;
        }

        children.appendData(child);

        if (ignoreWSAfter) {
            ignoreWSAfter = false;
            ignoreWS = true;
        }
    }

    // nothing were consumed
    if (child === null) {
        this.scanner.error('Selector is expected');
    }

    return {
        type: 'Selector',
        loc: this.getLocationFromList(children),
        children: children
    };
};
