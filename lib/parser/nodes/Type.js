var TYPE = require('../../scanner').TYPE;

var IDENTIFIER = TYPE.Identifier;
var ASTERISK = TYPE.Asterisk;
var VERTICALLINE = TYPE.VerticalLine;

// ident or ident|ident or *|ident or |ident
module.exports = function TypeOrUniversal() {
    var start = this.scanner.tokenStart;

    switch (this.scanner.tokenType) {
        case IDENTIFIER:
            this.scanner.next();

            if (this.scanner.tokenType === VERTICALLINE) {
                this.scanner.next();
                this.scanner.eat(IDENTIFIER);
            }

            break;

        case ASTERISK:
            this.scanner.next();
            this.scanner.eat(VERTICALLINE);
            this.scanner.eat(IDENTIFIER);

            break;

        case VERTICALLINE:
            this.scanner.next();
            this.scanner.eat(IDENTIFIER);

            break;

        default:
            this.scanner.error('Identifier expected');
    }

    return {
        type: 'Type',
        loc: this.getLocation(start, this.scanner.tokenStart),
        name: this.scanner.substrToCursor(start)
    };
};
