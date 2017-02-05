var List = require('../../utils/list');
var COMMA = require('../../tokenizer').TYPE.Comma;

module.exports = function MediaQueryList(relative) {
    this.readSC();

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

    return {
        type: 'MediaQueryList',
        loc: this.getLocationFromList(children),
        children: children
    };
};
