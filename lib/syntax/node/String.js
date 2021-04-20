import { String as StringToken } from '../../tokenizer/index.js';
import { decode, encode } from '../../utils/string.js';

export default {
    name: 'String',
    structure: {
        value: String
    },
    parse: function() {
        return {
            type: 'String',
            loc: this.getLocation(this.tokenStart, this.tokenEnd),
            value: decode(this.consume(StringToken))
        };
    },
    generate: function(node) {
        this.token(StringToken, encode(node.value));
    }
};
