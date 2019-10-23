var consumeNumber = require('../../tokenizer/utils').consumeNumber;
var TYPE = require('../../tokenizer').TYPE;

var DIMENSION = TYPE.Dimension;

module.exports = {
    name: 'Dimension',
    structure: {
        value: String,
        unit: String
    },
    parse: function() {
        var start = this.tokenStart;
        var numberEnd = consumeNumber(this.source, start);

        this.eat(DIMENSION);

        return {
            type: 'Dimension',
            loc: this.getLocation(start, this.tokenStart),
            value: this.source.substring(start, numberEnd),
            unit: this.source.substring(numberEnd, this.tokenStart)
        };
    },
    generate: function(node) {
        this.chunk(node.value);
        this.chunk(node.unit);
    }
};
