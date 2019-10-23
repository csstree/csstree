var CDO = require('../../tokenizer').TYPE.CDO;

module.exports = {
    name: 'CDO',
    structure: [],
    parse: function() {
        var start = this.tokenStart;

        this.eat(CDO); // <!--

        return {
            type: 'CDO',
            loc: this.getLocation(start, this.tokenStart)
        };
    },
    generate: function() {
        this.chunk('<!--');
    }
};
