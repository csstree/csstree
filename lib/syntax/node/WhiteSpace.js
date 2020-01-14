const { WhiteSpace } = require('../../tokenizer/types');
const SPACE = Object.freeze({
    type: 'WhiteSpace',
    loc: null,
    value: ' '
});

module.exports = {
    name: 'WhiteSpace',
    structure: {
        value: String
    },
    parse: function() {
        this.eat(WhiteSpace);
        return SPACE;

        // return {
        //     type: 'WhiteSpace',
        //     loc: this.getLocation(this.tokenStart, this.tokenEnd),
        //     value: this.consume(WHITESPACE)
        // };
    },
    generate: function(node) {
        this.token(WhiteSpace, node.value);
    }
};
