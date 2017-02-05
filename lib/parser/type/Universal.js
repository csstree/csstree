var TYPE = require('../../tokenizer').TYPE;

var IDENTIFIER = TYPE.Identifier;
var ASTERISK = TYPE.Asterisk;
var VERTICALLINE = TYPE.VerticalLine;

// * or *|* or ident|* or |*
module.exports = function Universal() {
    var start = this.scanner.tokenStart;

    switch (this.scanner.tokenType) {
        case ASTERISK:
            this.scanner.next();

            if (this.scanner.tokenType === VERTICALLINE) {
                this.scanner.next();
                this.scanner.eat(ASTERISK);
            }

            break;

        case IDENTIFIER:
            this.scanner.next();
            this.scanner.eat(VERTICALLINE);
            this.scanner.eat(ASTERISK);

            break;

        case VERTICALLINE:
            this.scanner.next();
            this.scanner.eat(ASTERISK);

            break;

        default:
            this.scanner.error('Universal selector expected');
    }

    return {
        type: 'Universal',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: this.scanner.substrToCursor(start)
    };
};
