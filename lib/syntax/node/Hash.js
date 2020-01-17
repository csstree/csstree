const { Hash } = require('../../tokenizer/types');

// '#' ident
module.exports = {
    name: 'Hash',
    structure: {
        value: String
    },
    parse: function() {
        const start = this.tokenStart;

        this.eat(Hash);

        return {
            type: 'Hash',
            loc: this.getLocation(start, this.tokenStart),
            value: this.substrToCursor(start + 1)
        };
    },
    generate: function(node) {
        this.token(Hash, '#' + node.value);
    }
};
