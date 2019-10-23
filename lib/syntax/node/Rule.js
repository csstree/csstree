var TYPE = require('../../tokenizer').TYPE;
var rawMode = require('./Raw').mode;

var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;

function consumeRaw(startToken) {
    return this.Raw(startToken, rawMode.leftCurlyBracket, true);
}

function consumePrelude() {
    var prelude = this.SelectorList();

    if (prelude.type !== 'Raw' &&
        this.eof === false &&
        this.tokenType !== LEFTCURLYBRACKET) {
        this.error();
    }

    return prelude;
}

module.exports = {
    name: 'Rule',
    structure: {
        prelude: ['SelectorList', 'Raw'],
        block: ['Block']
    },
    parse: function() {
        var startToken = this.tokenIndex;
        var startOffset = this.tokenStart;
        var prelude;
        var block;

        if (this.parseRulePrelude) {
            prelude = this.parseWithFallback(consumePrelude, consumeRaw);
        } else {
            prelude = consumeRaw.call(this, startToken);
        }

        block = this.Block(true);

        return {
            type: 'Rule',
            loc: this.getLocation(startOffset, this.tokenStart),
            prelude: prelude,
            block: block
        };
    },
    generate: function(node) {
        this.node(node.prelude);
        this.node(node.block);
    },
    walkContext: 'rule'
};
