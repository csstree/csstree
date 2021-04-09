const { Hash } = require('../../tokenizer/types');
const { decode, encode } = require('../../utils/ident');

// <hash-token>
module.exports = {
    name: 'IdSelector',
    structure: {
        name: String
    },
    parse: function() {
        const start = this.tokenStart;

        // TODO: check value is an ident
        this.eat(Hash);

        return {
            type: 'IdSelector',
            loc: this.getLocation(start, this.tokenStart),
            name: decode(this.substrToCursor(start + 1))
        };
    },
    generate: function(node) {
        this.token(Hash, '#' + encode(node.name));
    }
};
