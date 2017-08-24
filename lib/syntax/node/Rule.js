var TYPE = require('../../tokenizer').TYPE;

var WHITESPACE = TYPE.WhiteSpace;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var EOF = 0;

// TODO: move to Raw
function consumeRaw(start) {
    var type = 0;
    var lastType = 0;
    var node;

    scan:
    for (var i = 0; type = this.scanner.lookupType(i); i++) {
        switch (type) {
            case LEFTCURLYBRACKET:
            case EOF:
                break scan;
            default:
                lastType = type;
        }
    }

    if (lastType === WHITESPACE) {
        i--;
    }

    this.scanner.skip(i);
    node = {
        type: 'Raw',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: this.scanner.substrToCursor(start)
    };

    if (lastType === WHITESPACE) {
        this.scanner.next();
    }

    return node;
}

module.exports = {
    name: 'Rule',
    structure: {
        selector: ['SelectorList', 'Raw'],
        block: ['Block']
    },
    parse: function() {
        var start = this.scanner.tokenStart;
        var selector = this.parseSelector
            ? this.tolerantParse(this.SelectorList, consumeRaw)
            : consumeRaw.call(this);
        var block = this.Block(this.Declaration);

        return {
            type: 'Rule',
            loc: this.getLocation(start, this.scanner.tokenStart),
            selector: selector,
            block: block
        };
    },
    generate: function(processChunk, node) {
        this.generate(processChunk, node.selector);
        this.generate(processChunk, node.block);
    },
    walkContext: 'rule'
};
