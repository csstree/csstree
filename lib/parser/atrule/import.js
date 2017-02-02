var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var STRING = TYPE.String;
var IDENTIFIER = TYPE.Identifier;
var LEFTPARENTHESIS = TYPE.LeftParenthesis;

module.exports = {
    expression: function() {
        var children = new List();

        this.readSC();

        switch (this.scanner.tokenType) {
            case STRING:
                children.appendData(this.String());
                break;

            case IDENTIFIER:
                children.appendData(this.Url());
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

        return children;
    },
    block: false
};
