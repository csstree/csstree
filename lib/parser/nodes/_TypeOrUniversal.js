var TYPE = require('../../scanner').TYPE;

var IDENTIFIER = TYPE.Identifier;
var ASTERISK = TYPE.Asterisk;
var HYPHENMINUS = TYPE.HyphenMinus;
var VERTICALLINE = TYPE.VerticalLine;

// TODO: split to Type/Universal modules
module.exports = function TypeOrUniversal() {
    var start = this.scanner.tokenStart;
    var universal = false;

    if (this.scanner.tokenType === ASTERISK) {
        universal = true;
        this.scanner.next();
    } else if (this.scanner.tokenType !== VERTICALLINE) {
        this.scanIdent(false);
    }

    if (this.scanner.tokenType === VERTICALLINE) {
        universal = false;
        this.scanner.next();

        if (this.scanner.tokenType === HYPHENMINUS || this.scanner.tokenType === IDENTIFIER) {
            this.scanIdent(false);
        } else if (this.scanner.tokenType === ASTERISK) {
            universal = true;
            this.scanner.next();
        } else {
            this.scanner.error('Identifier or asterisk is expected');
        }
    }

    return {
        type: universal ? 'Universal' : 'Type',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: this.scanner.substrToCursor(start)
    };
};
