var TYPE = require('../../tokenizer').TYPE;

var IDENT = TYPE.Ident;

module.exports = {
    name: 'Identifier',
    structure: {
        name: String
    },
    parse: function() {
        return {
            type: 'Identifier',
            loc: this.getLocation(this.tokenStart, this.tokenEnd),
            name: this.consume(IDENT)
        };
    },
    generate: function(node) {
        this.chunk(node.name);
    }
};
