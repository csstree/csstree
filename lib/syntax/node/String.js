var STRING = require('../../tokenizer').TYPE.String;

module.exports = {
    name: 'String',
    structure: {
        value: String
    },
    parse: function() {
        return {
            type: 'String',
            loc: this.getLocation(this.tokenStart, this.tokenEnd),
            value: this.consume(STRING)
        };
    },
    generate: function(node) {
        this.chunk(node.value);
    }
};
