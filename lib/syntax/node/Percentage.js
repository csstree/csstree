const { consumeNumber } = require('../../tokenizer/utils');
const { Percentage } = require('../../tokenizer/types');

module.exports = {
    name: 'Percentage',
    structure: {
        value: String
    },
    parse: function() {
        const start = this.tokenStart;
        const numberEnd = consumeNumber(this.source, start);

        this.eat(Percentage);

        return {
            type: 'Percentage',
            loc: this.getLocation(start, this.tokenStart),
            value: this.substring(start, numberEnd)
        };
    },
    generate: function(node) {
        this.chunk(node.value);
        this.chunk('%');
    }
};
