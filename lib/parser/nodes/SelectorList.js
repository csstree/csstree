var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;

var COMMA = TYPE.Comma;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;

module.exports = function SelectorList(nested, relative) {
    this.readSC();

    var start = this.scanner.tokenStart;
    var end = start;
    var children = new List();
    var selector;
    var lastComma = -2;

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
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

            case COMMA:
                if (lastComma !== -1) {
                    this.scanner.error('Unexpected comma');
                }

                lastComma = this.scanner.tokenStart;
                this.scanner.next();
                break;

            default:
                lastComma = -1;
                selector = this.Selector(nested, relative);
                children.appendData(selector);

                if (selector.children.isEmpty()) {
                    this.scanner.error('Simple selector expected');
                }

                if (this.needPositions) {
                    end = selector.children.last().loc.end.offset;
                }
        }
    }

    if (lastComma !== -1 && lastComma !== -2) {
        this.scanner.error('Unexpected trailing comma', lastComma);
    }

    return {
        type: 'SelectorList',
        loc: this.getLocation(start, end),
        children: children
    };
};
