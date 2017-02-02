var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var WHITESPACE = TYPE.Whitespace;
var COMMENT = TYPE.Comment;
var IDENTIFIER = TYPE.Identifier;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var DISALLOW_VAR = false;

module.exports = function MediaQuery() {
    this.readSC();

    var start = this.scanner.tokenStart;
    var end = start;
    var children = new List();
    var wasSpace = false;
    var child = null;

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case WHITESPACE:
                wasSpace = true;
                this.scanner.next();
                continue;

            case COMMENT:
                this.scanner.next();
                continue;

            case IDENTIFIER:
                if (!children.isEmpty() && !wasSpace) {
                    this.scanner.error('Space is expected');
                }

                child = this.Identifier(DISALLOW_VAR);
                break;

            case LEFTPARENTHESIS:
                if (!children.isEmpty() && !wasSpace) {
                    this.scanner.error('Space is expected');
                }

                child = this.MediaFeature();
                break;

            default:
                break scan;
        }

        children.appendData(child);
    }

    if (child === null) {
        this.scanner.error('Identifier or parenthesis is expected');
    }

    if (this.needPositions) {
        end = child.loc.end.offset;
    }

    return {
        type: 'MediaQuery',
        loc: this.getLocation(start, end),
        children: children
    };
};
