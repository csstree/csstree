const { Percentage } = require('../../tokenizer/types');

module.exports = {
    name: 'Percentage',
    structure: {
        value: String
    },
    parse: function() {
        const start = this.tokenStart;
        const value = this.consumeNumber(Percentage);

        return {
            type: 'Percentage',
            loc: this.getLocation(start, this.tokenStart),
            value
        };
    },
    generate: function(node) {
        this.token(Percentage, node.value + '%');
    }
};
