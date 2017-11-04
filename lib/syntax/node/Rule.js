var TYPE = require('../../tokenizer').TYPE;

var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;

function consumeRaw(startToken) {
    return this.Raw(startToken, LEFTCURLYBRACKET, 0, false, true);
}

module.exports = {
    name: 'Rule',
    structure: {
        prelude: ['SelectorList', 'Raw'],
        block: ['Block']
    },
    parse: function() {
        var startToken = this.scanner.currentToken;
        var startOffset = this.scanner.tokenStart;
        var prelude;
        var block;
        var error;

        if (this.parseRulePrelude) {
            prelude = this.parseWithFallback(this.SelectorList, consumeRaw);

            if (!this.scanner.eof) {
                if (prelude.type !== 'Raw' && this.scanner.tokenType !== LEFTCURLYBRACKET) {
                    error = this.scanner.createError();
                    prelude = consumeRaw.call(this, startToken);
                    this.notifyParseError(error, prelude);
                }
            }
        } else {
            prelude = consumeRaw.call(this, startToken);
        }

        block = this.Block(true);

        return {
            type: 'Rule',
            loc: this.getLocation(startOffset, this.scanner.tokenStart),
            prelude: prelude,
            block: block
        };
    },
    generate: function(processChunk, node) {
        this.generate(processChunk, node.prelude);
        this.generate(processChunk, node.block);
    },
    walkContext: 'rule'
};
