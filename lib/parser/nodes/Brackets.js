var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var WHITESPACE = TYPE.Whitespace;
var COMMENT = TYPE.Comment;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var RIGHTSQUAREBRACKET = TYPE.RightSquareBracket;

// currently only Grid Layout uses square brackets
// https://drafts.csswg.org/css-grid/#track-sizing
// [ ident* ]
module.exports = function Brackets() {
    var start = this.scanner.tokenStart;
    var children = new List();
    var wasSpace = false;
    var child;

    // left bracket
    this.scanner.eat(LEFTSQUAREBRACKET);
    this.readSC();

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case RIGHTSQUAREBRACKET:
                break scan;

            case WHITESPACE:
                wasSpace = true;
                this.scanner.next();
                continue;

            case COMMENT: // ignore comments
                this.scanner.next();
                continue;

            default:
                child = this.Identifier(false);
        }

        if (wasSpace) {
            wasSpace = false;
            children.appendData(this.SPACE_NODE);
        }

        children.appendData(child);
    }

    // right bracket
    this.scanner.eat(RIGHTSQUAREBRACKET);

    return {
        type: 'Brackets',
        loc: this.getLocation(start, this.scanner.tokenStart),
        children: children
    };
};
