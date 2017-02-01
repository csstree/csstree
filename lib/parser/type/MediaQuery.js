var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var IDENTIFIER = TYPE.Identifier;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;
var DISALLOW_VAR = false;

function readMediaType() {
    if (this.scanner.lookupValue(0, 'and')) {
        this.scanner.error('Unexpected `and` keyword');
    }

    return this.Identifier(DISALLOW_VAR);
}

module.exports = function MediaQuery() {
    this.readSC();

    var start = this.scanner.tokenStart;
    var end = start;
    var children = new List();

    if (this.scanner.lookupValue(0, 'only') ||
        this.scanner.lookupValue(0, 'not')) {
        // [ not | only ] s+ ident
        children.appendData(this.Identifier(DISALLOW_VAR));
        this.readSC();

        children.appendData(readMediaType.call(this));
        this.readSC();
    } else if (this.scanner.tokenType === IDENTIFIER) {
        children.appendData(readMediaType.call(this));
        this.readSC();
    } else if (this.scanner.tokenType === LEFTPARENTHESIS) {
        // <MediaFeature>
        children.appendData(this.MediaFeature());
        this.readSC();
    } else {
        this.scanner.error('Identifier or parenthesis is expected');
    }

    // better error message for common mistake
    if (this.scanner.tokenType === IDENTIFIER &&
        this.scanner.lookupValue(0, 'and') === false) {
        this.scanner.error('Unexpected identifier');
    }

    while (!this.scanner.eof) {
        if (this.scanner.lookupValue(0, 'and')) {
            if (children.isEmpty()) {
                this.scanner.error('Unexpected `and` keyword');
            }

            children.appendData(this.Identifier(DISALLOW_VAR));
            this.readSC();
        } else {
            if (this.scanner.tokenType === LEFTPARENTHESIS) {
                this.scanner.error('`and` keyword is expected');
            }
            break;
        }

        children.appendData(this.MediaFeature());
        this.readSC();
    }

    if (this.needPositions) {
        end = children.last().loc.end.offset;
    }

    return {
        type: 'MediaQuery',
        loc: this.getLocation(start, end),
        children: children
    };
};
