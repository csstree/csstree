var TYPE = require('../../tokenizer').TYPE;

var HASH = TYPE.Hash;

// '#' ident
module.exports = {
    name: 'HexColor',
    structure: {
        value: String
    },
    parse: function() {
        var start = this.tokenStart;

        this.eat(HASH);

        return {
            type: 'HexColor',
            loc: this.getLocation(start, this.tokenStart),
            value: this.substrToCursor(start + 1)
        };
    },
    generate: function(node) {
        this.chunk('#');
        this.chunk(node.value);
    }
};
