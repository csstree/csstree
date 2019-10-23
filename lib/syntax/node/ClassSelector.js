var TYPE = require('../../tokenizer').TYPE;

var IDENT = TYPE.Ident;
var FULLSTOP = 0x002E; // U+002E FULL STOP (.)

// '.' ident
module.exports = {
    name: 'ClassSelector',
    structure: {
        name: String
    },
    parse: function() {
        if (!this.isDelim(FULLSTOP)) {
            this.error('Full stop is expected');
        }

        this.next();

        return {
            type: 'ClassSelector',
            loc: this.getLocation(this.tokenStart - 1, this.tokenEnd),
            name: this.consume(IDENT)
        };
    },
    generate: function(node) {
        this.chunk('.');
        this.chunk(node.name);
    }
};
