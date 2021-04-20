import { Percentage } from '../../tokenizer/index.js';

export default {
    name: 'Percentage',
    structure: {
        value: String
    },
    parse: function() {
        return {
            type: 'Percentage',
            loc: this.getLocation(this.tokenStart, this.tokenEnd),
            value: this.consumeNumber(Percentage)
        };
    },
    generate: function(node) {
        this.token(Percentage, node.value + '%');
    }
};
