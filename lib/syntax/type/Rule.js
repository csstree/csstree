var TYPE = require('../../tokenizer').TYPE;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var BALANCED = true;

module.exports = {
    name: 'Rule',
    parse: function() {
        var start = this.scanner.tokenStart;
        var selector = this.parseSelector ? this.SelectorList() : this.Raw(BALANCED, LEFTCURLYBRACKET, 0);
        var block = this.Block(this.Declaration);

        return {
            type: 'Rule',
            loc: this.getLocation(start, this.scanner.tokenStart),
            selector: selector,
            block: block
        };
    },
    generate: function(node) {
        return this.generate(node.selector) + this.generate(node.block);
    },
    walk: function(node, context, walk) {
        context.rule = node;

        if (node.selector !== null) {
            walk(node.selector);
        }
        walk(node.block);

        context.rule = null;
    }
};
