var TYPE = require('../../tokenizer').TYPE;

var IDENT = TYPE.Ident;
var ASTERISK = 0x002A;     // U+002A ASTERISK (*)
var VERTICALLINE = 0x007C; // U+007C VERTICAL LINE (|)

function eatIdentifierOrAsterisk() {
    if (this.tokenType !== IDENT &&
        this.isDelim(ASTERISK) === false) {
        this.error('Identifier or asterisk is expected');
    }

    this.next();
}

// ident
// ident|ident
// ident|*
// *
// *|ident
// *|*
// |ident
// |*
module.exports = {
    name: 'TypeSelector',
    structure: {
        name: String
    },
    parse: function() {
        var start = this.tokenStart;

        if (this.isDelim(VERTICALLINE)) {
            this.next();
            eatIdentifierOrAsterisk.call(this);
        } else {
            eatIdentifierOrAsterisk.call(this);

            if (this.isDelim(VERTICALLINE)) {
                this.next();
                eatIdentifierOrAsterisk.call(this);
            }
        }

        return {
            type: 'TypeSelector',
            loc: this.getLocation(start, this.tokenStart),
            name: this.substrToCursor(start)
        };
    },
    generate: function(node) {
        this.chunk(node.name);
    }
};
