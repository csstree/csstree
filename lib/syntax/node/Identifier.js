import { Ident } from '../../tokenizer/index.js';

export default {
    name: 'Identifier',
    structure: {
        name: String
    },
    parse: function() {
        return {
            type: 'Identifier',
            loc: this.getLocation(this.tokenStart, this.tokenEnd),
            name: this.consume(Ident)
        };
    },
    generate: function(node) {
        this.token(Ident, node.name);
    }
};
