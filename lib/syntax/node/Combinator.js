const { Ident } = require('../../tokenizer/types');

const PLUSSIGN = 0x002B;        // U+002B PLUS SIGN (+)
const SOLIDUS = 0x002F;         // U+002F SOLIDUS (/)
const GREATERTHANSIGN = 0x003E; // U+003E GREATER-THAN SIGN (>)
const TILDE = 0x007E;           // U+007E TILDE (~)

// + | > | ~ | /deep/
module.exports = {
    name: 'Combinator',
    structure: {
        name: String
    },
    parse: function() {
        const start = this.tokenStart;
        const code = this.charCodeAt(this.tokenStart);

        switch (code) {
            case GREATERTHANSIGN:
            case PLUSSIGN:
            case TILDE:
                this.next();
                break;

            case SOLIDUS:
                this.next();

                if (this.tokenType !== Ident || this.lookupValue(0, 'deep') === false) {
                    this.error('Identifier `deep` is expected');
                }

                this.next();

                if (!this.isDelim(SOLIDUS)) {
                    this.error('Solidus is expected');
                }

                this.next();
                break;

            default:
                this.error('Combinator is expected');
        }

        return {
            type: 'Combinator',
            loc: this.getLocation(start, this.tokenStart),
            name: this.substrToCursor(start)
        };
    },
    generate: function(node) {
        this.chunk(node.name);
    }
};
