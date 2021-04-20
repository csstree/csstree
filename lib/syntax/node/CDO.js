import { CDO } from '../../tokenizer/index.js';

export default {
    name: 'CDO',
    structure: [],
    parse: function() {
        const start = this.tokenStart;

        this.eat(CDO); // <!--

        return {
            type: 'CDO',
            loc: this.getLocation(start, this.tokenStart)
        };
    },
    generate: function() {
        this.token(CDO, '<!--');
    }
};
