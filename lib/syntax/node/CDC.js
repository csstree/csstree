import { CDC } from '../../tokenizer/index.js';

export default {
    name: 'CDC',
    structure: [],
    parse: function() {
        const start = this.tokenStart;

        this.eat(CDC); // -->

        return {
            type: 'CDC',
            loc: this.getLocation(start, this.tokenStart)
        };
    },
    generate: function() {
        this.token(CDC, '-->');
    }
};
