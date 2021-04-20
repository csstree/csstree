import { Dimension } from '../../tokenizer/index.js';

export default {
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
            unit: this.substring(start + value.length, this.tokenStart)
        };
    },
    generate: function(node) {
        this.token(Dimension, node.value + node.unit);
    }
};
