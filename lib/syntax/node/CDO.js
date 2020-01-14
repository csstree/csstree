const { CDO } = require('../../tokenizer/types');

module.exports = {
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
