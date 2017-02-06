var List = require('../../utils/list');
var COMMA = require('../../tokenizer').TYPE.Comma;

module.exports = function MediaQueryList(relative) {
    var children = new List();

    this.readSC();

    while (!this.scanner.eof) {
        children.appendData(this.MediaQuery(relative));

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
