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

    this.readSC();

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case COMMENT:
                this.scanner.next();
                continue;

            case WHITESPACE:
                if (child.type !== 'Combinator') {
                    space = this.Space();
                } else {
                    this.scanner.next();
                }
                continue;

            case PLUSSIGN:
            case GREATERTHANSIGN:
            case TILDE:
            case SOLIDUS:
                space = null;
                child = this.Combinator();
                break;

            case FULLSTOP:
                child = this.ClassSelector();
                break;

            case LEFTSQUAREBRACKET:
                child = this.Attribute();
                break;

            case NUMBERSIGN:
                child = this.IdSelector();
                break;

            case COLON:
                if (this.scanner.lookupType(1) === COLON) {
                    child = this.PseudoElement();
                } else {
                    child = this.PseudoClass();
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
