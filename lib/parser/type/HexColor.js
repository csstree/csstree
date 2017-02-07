var isNumber = require('../../tokenizer').isNumber;
var TYPE = require('../../tokenizer').TYPE;

var IDENTIFIER = TYPE.Identifier;
var NUMBER = TYPE.Number;
var NUMBERSIGN = TYPE.NumberSign;
var PLUSSIGN = TYPE.PlusSign;
var HYPHENMINUS = TYPE.HyphenMinus;
var FULLSTOP = TYPE.FullStop;

// # ident
module.exports = function HexColor() {
    var start = this.scanner.tokenStart;

    this.scanner.eat(NUMBERSIGN);

    scan:
    switch (this.scanner.tokenType) {
        case NUMBER:
            if (!isNumber(this.scanner.source.charCodeAt(this.scanner.tokenStart))) {
                this.scanner.error('Unexpected input', this.scanner.tokenStart);
            }

            for (var pos = this.scanner.tokenStart + 1; pos < this.scanner.tokenEnd; pos++) {
                var code = this.scanner.source.charCodeAt(pos);

                // break on fullstop or hyperminus/plussign after exponent
                if (code === FULLSTOP || code === HYPHENMINUS || code === PLUSSIGN) {
                    // break token, exclude symbol
                    this.scanner.tokenStart = pos;
                    break scan;
                }
            }

            // number contains digits only, go to next token
            this.scanner.next();

            // if next token is identifier add it to result
            // TODO: consume hex only
            if (this.scanner.tokenType === IDENTIFIER) {
                this.scanner.next();
            }

            break;

        case IDENTIFIER:
            // TODO: consume hex only
            this.scanner.next(); // add token to result
            break;

        default:
            this.scanner.error('Number or identifier is expected');
    }

    return {
        type: 'HexColor',
        loc: this.getLocation(start, this.scanner.tokenStart),
        value: this.scanner.substrToCursor(start + 1) // skip #
    };
};
