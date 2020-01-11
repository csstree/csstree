const { Ident } = require('../../tokenizer/types');

module.exports = {
    name: 'Identifier',
    structure: {
        name: String
    },
    parse: function() {
        return {
            type: 'Identifier',
            loc: this.getLocation(this.tokenStart, this.tokenEnd),
            name: this.consume(Ident)
        };
    },
    generate: function(node) {
        this.chunk(node.name);
    }
};
