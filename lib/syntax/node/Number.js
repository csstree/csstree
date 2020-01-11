const { Number } = require('../../tokenizer/types');

module.exports = {
    name: 'Number',
    structure: {
        value: String
    },
    parse: function() {
        return {
            type: 'Number',
            loc: this.getLocation(this.tokenStart, this.tokenEnd),
            value: this.consume(Number)
        };
    },
    generate: function(node) {
        this.chunk(node.value);
    }
};
