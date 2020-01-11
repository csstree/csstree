const { consumeNumber } = require('../../tokenizer/utils');
const { Dimension } = require('../../tokenizer/types');

module.exports = {
    name: 'Dimension',
    structure: {
        value: String,
        unit: String
    },
    parse: function() {
        const start = this.tokenStart;
        const numberEnd = consumeNumber(this.source, start);

        this.eat(Dimension);

        return {
            type: 'Dimension',
            loc: this.getLocation(start, this.tokenStart),
            value: this.substring(start, numberEnd),
            unit: this.substring(numberEnd, this.tokenStart)
        };
    },
    generate: function(node) {
        this.chunk(node.value);
        this.chunk(node.unit);
    }
};
