var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;

module.exports = {
    parse: {
        prelude: function() {
            if (this.scanner.lookupNonWSType(0) === LEFTCURLYBRACKET) {
                return null;
            }

            return new List().appendData(
                this.SelectorList()
            );
        },
        block: function() {
            return this.Block(this.Declaration);
        }
    }
};
