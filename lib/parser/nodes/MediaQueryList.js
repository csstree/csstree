var List = require('../../utils/list');
var COMMA = require('../../scanner').TYPE.Comma;

module.exports = function MediaQueryList(relative) {
    this.readSC();

    var start = this.scanner.tokenStart;
    var end = start;
    var children = new List();
    var mediaQuery = null;

    while (!this.scanner.eof) {
        mediaQuery = this.MediaQuery(relative);
        children.appendData(mediaQuery);

        if (this.needPositions) {
            end = mediaQuery.children.last().loc.end.offset;
        }

        if (this.scanner.tokenType === COMMA) {
            this.scanner.next();
            continue;
        }

        break;
    }

    return {
        type: 'MediaQueryList',
        loc: this.getLocation(start, end),
        children: children
    };
};
