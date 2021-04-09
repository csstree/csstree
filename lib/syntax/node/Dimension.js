const { Dimension } = require('../../tokenizer/types');
const { decode, encode } = require('../../utils/ident');

module.exports = {
    name: 'Dimension',
    structure: {
        value: String,
        unit: String
    },
    parse: function() {
        const start = this.tokenStart;
        const value = this.consumeNumber(Dimension);

        return {
            type: 'Dimension',
            loc: this.getLocation(start, this.tokenStart),
            value,
            unit: decode(this.substrToCursor(start + value.length))
        };
    },
    generate: function(node) {
        this.token(Dimension, node.value + encode(node.unit));
    }
};
