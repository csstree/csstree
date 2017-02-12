var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var COMMA = TYPE.Comma;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var BALANCED = true;

module.exports = function SelectorList() {
    var children = new List();

    while (!this.scanner.eof) {
        children.appendData(this.parseSelector
            ? this.Selector()
            : this.Raw(BALANCED, COMMA, LEFTCURLYBRACKET)
        );

        if (this.scanner.tokenType === COMMA) {
            this.scanner.next();
            continue;
        }

        break;
    }

    return {
        type: 'SelectorList',
        loc: this.getLocationFromList(children),
        children: children
    };
};
