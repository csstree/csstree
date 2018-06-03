var isHexDigit = require('../../tokenizer').isHexDigit;
var TYPE = require('../../tokenizer').TYPE;

var IDENTIFIER = TYPE.Identifier;
var NUMBER = TYPE.Number;
var NUMBERSIGN = TYPE.NumberSign;

function consumeHexSequence(scanner, required) {
    if (!isHexDigit(scanner.source.charCodeAt(scanner.tokenStart))) {
        if (required) {
            this.error('Unexpected input', scanner.tokenStart);
        } else {
            return;
        }
    }

    for (var pos = scanner.tokenStart + 1; pos < scanner.tokenEnd; pos++) {
        var code = scanner.source.charCodeAt(pos);

        // break on non-hex char
        if (!isHexDigit(code)) {
            // break token, exclude symbol
            scanner.tokenStart = pos;
            return;
        }
    }

    // token is full hex sequence, go to next token
    scanner.next();
}

// # ident
module.exports = {
    name: 'HexColor',
    structure: {
        value: String
    },
    parse: function() {
        var start = this.scanner.tokenStart;

        this.eat(NUMBERSIGN);

        scan:
        switch (this.scanner.tokenType) {
            case NUMBER:
                consumeHexSequence.call(this, this.scanner, true);

                // if token is identifier then number consists of hex only,
                // try to add identifier to result
                if (this.scanner.tokenType === IDENTIFIER) {
                    consumeHexSequence.call(this, this.scanner, false);
                }

                break;

            case IDENTIFIER:
                consumeHexSequence.call(this, this.scanner, true);
                break;

            default:
                this.error('Number or identifier is expected');
        }

        return {
            type: 'HexColor',
            loc: this.getLocation(start, this.scanner.tokenStart),
            value: this.scanner.substrToCursor(start + 1) // skip #
        };
    },
    generate: function(node) {
        this.chunk('#');
        this.chunk(node.value);
    }
};
