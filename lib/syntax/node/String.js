const { String: StringToken } = require('../../tokenizer/types');
const { decode, encode } = require('../../utils/string');

module.exports = {
    name: 'String',
    structure: {
        value: String
    },
    parse: function() {
        return {
            type: 'String',
            loc: this.getLocation(this.tokenStart, this.tokenEnd),
            value: decode(this.consume(StringToken))
        };
    },
    generate: function(node) {
        this.token(StringToken, encode(node.value));
    }
};
