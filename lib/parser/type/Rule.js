var TYPE = require('../../tokenizer').TYPE;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var BALANCED = true;

module.exports = function Rule() {
    var start = this.scanner.tokenStart;
    var selector = this.parseSelector ? this.SelectorList() : this.Raw(BALANCED, LEFTCURLYBRACKET, 0);
    var block = this.Block(this.Declaration);

    return {
        type: 'Rule',
        loc: this.getLocation(start, this.scanner.tokenStart),
        selector: selector,
        block: block
    };
};
