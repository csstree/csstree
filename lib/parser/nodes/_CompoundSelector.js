var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var WHITESPACE = TYPE.Whitespace;
var IDENTIFIER = TYPE.Identifier;
var COMMENT = TYPE.Comment;
var NUMBERSIGN = TYPE.NumberSign;
var ASTERISK = TYPE.Asterisk;
var FULLSTOP = TYPE.FullStop;
var COLON = TYPE.Colon;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var VERTICALLINE = TYPE.VerticalLine;

module.exports = function CompoundSelector() {
    var start = this.scanner.tokenStart;
    var children = new List();
    var child = null;

    this.readSC();

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
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

            case IDENTIFIER:
            case ASTERISK:
            case VERTICALLINE:
                child = this.TypeOrUniversal();
                break;

            default:
                break scan;
        }

        children.appendData(child);
    }

    // nothing were consumed
    if (child === null) {
        this.scanner.error('Selector is expected');
    }

    return {
        type: 'Selector',
        loc: this.getLocation(start, this.scanner.tokenStart),
        children: children
    };
};
