const { Delim, Ident } = require('../../tokenizer/types');
const { decode, encode } = require('../../utils/ident');

const FULLSTOP = 0x002E; // U+002E FULL STOP (.)

// '.' ident
module.exports = {
    name: 'ClassSelector',
    structure: {
        name: String
    },
    parse: function() {
        this.eatDelim(FULLSTOP);

        return {
            type: 'ClassSelector',
            loc: this.getLocation(this.tokenStart - 1, this.tokenEnd),
            name: decode(this.consume(Ident))
        };
    },
    generate: function(node) {
        this.token(Delim, '.');
        this.token(Ident, encode(node.name));
    }
};
