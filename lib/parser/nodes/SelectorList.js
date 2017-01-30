var List = require('../../utils/list');
var COMMA = require('../../scanner').TYPE.Comma;

module.exports = function SelectorList(relative) {
    this.readSC();

    var start = this.scanner.tokenStart;
    var end = start;
    var children = new List();
    var selector = null;

    while (!this.scanner.eof) {
        selector = this.Selector(relative);
        children.appendData(selector);

        if (this.needPositions) {
            end = selector.children.last().loc.end.offset;
        }

        if (this.scanner.tokenType === COMMA) {
            this.scanner.next();
            continue;
        }

        break;
    }

    return {
        type: 'SelectorList',
        loc: this.getLocation(start, end),
        children: children
    };
};
