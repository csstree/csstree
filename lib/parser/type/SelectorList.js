var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var COMMA = TYPE.Comma;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var BALANCED = true;

module.exports = function SelectorList(relative) {
    this.readSC();

    var children = new List();
    var selector = null;

    while (!this.scanner.eof) {
        selector = this.parseSelector ? this.Selector(relative) : this.Raw(BALANCED, COMMA, LEFTCURLYBRACKET);
        children.appendData(selector);

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
