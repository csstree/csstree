var CDC = require('../../tokenizer').TYPE.CDC;

module.exports = {
    name: 'CDC',
    structure: [],
    parse: function() {
        var start = this.tokenStart;

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
