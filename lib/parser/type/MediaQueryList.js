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

        if (this.scanner.tokenType !== COMMA) {
            break;
        }

        this.scanner.next();
    }

    if (this.needPositions) {
        end = mediaQuery.children.last().loc.end.offset;
    }

    return {
        type: 'MediaQueryList',
        loc: this.getLocation(start, end),
        children: children
    };
};
