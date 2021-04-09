const { Ident } = require('../../tokenizer/types');
const { decode, encode } = require('../../utils/ident');

module.exports = {
    name: 'Identifier',
    structure: {
        name: String
    },
    parse: function() {
        return {
            type: 'Identifier',
            loc: this.getLocation(this.tokenStart, this.tokenEnd),
            name: decode(this.consume(Ident))
        };
    },
    generate: function(node) {
        this.token(Ident, encode(node.name));
    }
};
