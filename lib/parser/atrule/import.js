var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var STRING = TYPE.String;
var IDENTIFIER = TYPE.Identifier;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;

module.exports = {
    expression: function() {
        this.readSC();

        var start = this.scanner.tokenStart;
        var end = start;
        var children = new List();

        switch (this.scanner.tokenType) {
            case STRING:
                children.appendData(this.String());
                break;

            case IDENTIFIER:
                // TODO: refactoring of Url needed
                if (!this.scanner.lookupValue(0, 'url')) {
                    this.scanner.error('`url()` is expected');
                }

                this.scanner.next();
                children.appendData(this.Url(null, this.scanner.tokenStart - 3));
                break;

            default:
                this.scanner.error('String or url() is expected');
        }

        this.readSC();

        if (this.scanner.tokenType === IDENTIFIER ||
            this.scanner.tokenType === LEFTPARENTHESIS) {
            children.appendData(this.SPACE_NODE);
            children.appendData(this.MediaQueryList());
        }

        if (this.needPositions) {
            end = children.last().loc.end.offset;
        }

        return {
            type: 'AtruleExpression',
            loc: this.getLocation(start, end),
            children: children
        };
    },
    block: false
};
