import { Number as NumberToken } from '../../tokenizer/index.js';

export default {
    name: 'Number',
    structure: {
        value: String
    },
    parse: function() {
        return {
            type: 'Number',
            loc: this.getLocation(this.tokenStart, this.tokenEnd),
            value: this.consume(NumberToken)
        };
    },
    generate: function(node) {
        this.token(NumberToken, node.value);
    }
};
