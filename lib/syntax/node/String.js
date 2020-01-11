const { String: StringToken } = require('../../tokenizer/types');

module.exports = {
    name: 'String',
    structure: {
        value: String
    },
    parse: function() {
        return {
            type: 'String',
            loc: this.getLocation(this.tokenStart, this.tokenEnd),
            value: this.consume(StringToken)
        };
    },
    generate: function(node) {
        this.chunk(node.value);
    }
};
