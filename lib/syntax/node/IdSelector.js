var TYPE = require('../../tokenizer').TYPE;

var HASH = TYPE.Hash;

// <hash-token>
module.exports = {
    name: 'IdSelector',
    structure: {
        name: String
    },
    parse: function() {
        var start = this.tokenStart;

        // TODO: check value is an ident
        this.eat(HASH);

        return {
            type: 'IdSelector',
            loc: this.getLocation(start, this.tokenStart),
            name: this.substrToCursor(start + 1)
        };
    },
    generate: function(node) {
        this.chunk('#');
        this.chunk(node.name);
    }
};
