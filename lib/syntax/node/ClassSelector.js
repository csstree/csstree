var TYPE = require('../../tokenizer').TYPE;
var CHARCODE = require('../../tokenizer').CHARCODE;

var IDENTIFIER = TYPE.Identifier;
var FULLSTOP = CHARCODE.FullStop;

// '.' ident
module.exports = {
    name: 'ClassSelector',
    structure: {
        name: String
    },
    parse: function() {
        this.eat(FULLSTOP);

        return {
            type: 'ClassSelector',
            loc: this.getLocation(this.scanner.tokenStart - 1, this.scanner.tokenEnd),
            name: this.consume(IDENTIFIER)
        };
    },
    generate: function(node) {
        this.chunk('.');
        this.chunk(node.name);
    }
};
