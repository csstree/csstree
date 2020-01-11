const { CDC } = require('../../tokenizer/types');

module.exports = {
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
        this.chunk('-->');
    }
};
